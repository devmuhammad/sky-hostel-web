import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

export async function POST(request: NextRequest) {
  try {
    const { adminKey } = await request.json();

    // Simple admin key check
    if (adminKey !== "admin123") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all Paycashless invoices
    const paycashlessResult = await getAllPaycashlessInvoices({
      limit: 100, // Get last 100 invoices
    });

    if (!paycashlessResult.success || !paycashlessResult.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch Paycashless invoices",
        },
        { status: 500 }
      );
    }

    const paycashlessInvoices = paycashlessResult.data.invoices || [];

    // Get all local payments
    const { data: localPayments, error: localError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (localError) {
      console.error("Error fetching local payments:", localError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch local payments",
        },
        { status: 500 }
      );
    }

    // Process each Paycashless invoice
    const results = {
      totalPaycashlessInvoices: paycashlessInvoices.length,
      matchingRecords: 0,
      updatedRecords: 0,
      newRecordsCreated: 0,
      recordsNeedingUpdate: 0,
      updatedPayments: [] as any[],
      newPayments: [] as any[],
      mismatches: [] as any[],
    };

    // Group invoices by email and keep only the most recent one for each email
    const emailToInvoiceMap = new Map<string, any>();

    for (const paycashlessInvoice of paycashlessInvoices) {
      const email = paycashlessInvoice.customer?.email;
      if (!email) {
        console.log("Skipping invoice without email:", paycashlessInvoice.id);
        continue;
      }

      // Keep the invoice with the highest payment amount for each email
      // If same amount, keep the most recent one
      const existingInvoice = emailToInvoiceMap.get(email);
      if (!existingInvoice) {
        emailToInvoiceMap.set(email, paycashlessInvoice);
      } else {
        const existingAmount = existingInvoice.totalPaid || 0;
        const currentAmount = paycashlessInvoice.totalPaid || 0;

        if (currentAmount > existingAmount) {
          // Current invoice has higher payment amount
          emailToInvoiceMap.set(email, paycashlessInvoice);
        } else if (currentAmount === existingAmount) {
          // Same amount, keep the most recent one
          if (
            new Date(paycashlessInvoice.createdAt) >
            new Date(existingInvoice.createdAt)
          ) {
            emailToInvoiceMap.set(email, paycashlessInvoice);
          }
        }
        // If current amount is less, keep the existing one
      }
    }

    for (const [email, paycashlessInvoice] of emailToInvoiceMap) {
      // Find matching local payment by invoice_id first, then by email
      let localPayment = localPayments?.find(
        (p) => p.invoice_id === paycashlessInvoice.id
      );

      if (!localPayment) {
        localPayment = localPayments?.find((p) => p.email === email);
      }

      const paycashlessAmount = paycashlessInvoice.totalPaid || 0;
      const paycashlessStatus = paycashlessInvoice.status;
      const isFullyPaid = paycashlessAmount >= PAYMENT_CONFIG.amount;

      // Determine the correct status based on Paycashless data
      let correctStatus = "pending";
      if (isFullyPaid) {
        correctStatus = "completed";
      } else if (paycashlessAmount > 0) {
        correctStatus = "partially_paid";
      }

      if (!localPayment) {
        // Check if we already have a payment for this email (to avoid duplicates)
        const existingPaymentForEmail = localPayments?.find(
          (p) => p.email === email
        );

        if (existingPaymentForEmail) {
          // Update existing payment instead of creating new one
          const localAmount = existingPaymentForEmail.amount_paid || 0;
          const localStatus = existingPaymentForEmail.status;

          const needsUpdate =
            localAmount !== paycashlessAmount || localStatus !== correctStatus;

          if (needsUpdate) {
            const updateData = {
              amount_paid: paycashlessAmount,
              status: correctStatus,
              paid_at: isFullyPaid ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            };

            const { data: updatedPayment, error: updateError } =
              await supabaseAdmin
                .from("payments")
                .update(updateData)
                .eq("id", existingPaymentForEmail.id)
                .select()
                .single();

            if (updateError) {
              console.error(
                "Error updating existing payment for",
                email,
                updateError
              );
              results.mismatches.push({
                email,
                paycashlessAmount,
                paycashlessStatus,
                localAmount,
                localStatus,
                error: "Update failed",
              });
              continue;
            }

            results.updatedRecords++;
            results.updatedPayments.push({
              email,
              oldAmountPaid: localAmount,
              oldStatus: localStatus,
              newAmountPaid: paycashlessAmount,
              newStatus: correctStatus,
            });

            results.matchingRecords++;
          }
          continue;
        }

        // Create new payment record only if no existing payment for this email
        const newPayment = {
          email,
          phone: paycashlessInvoice.customer?.phoneNumber || "",
          amount_to_pay: PAYMENT_CONFIG.amount,
          amount_paid: paycashlessAmount,
          invoice_id: paycashlessInvoice.id,
          status: correctStatus,
          paid_at: isFullyPaid ? new Date().toISOString() : null,
        };

        const { data: createdPayment, error: createError } = await supabaseAdmin
          .from("payments")
          .insert(newPayment)
          .select()
          .single();

        if (createError) {
          console.error("Error creating payment for", email, createError);
          continue;
        }

        results.newRecordsCreated++;
        results.newPayments.push({
          email,
          amountPaid: paycashlessAmount,
          status: newPayment.status,
        });
      } else {
        // Check if update is needed - only update if Paycashless data is different
        const localAmount = localPayment.amount_paid || 0;
        const localStatus = localPayment.status;

        // Only update if there's an actual difference
        const needsUpdate =
          localAmount !== paycashlessAmount || localStatus !== correctStatus;

        if (needsUpdate) {
          // Update payment with correct Paycashless data
          const updateData = {
            amount_paid: paycashlessAmount,
            status: correctStatus,
            paid_at: isFullyPaid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          const { data: updatedPayment, error: updateError } =
            await supabaseAdmin
              .from("payments")
              .update(updateData)
              .eq("id", localPayment.id)
              .select()
              .single();

          if (updateError) {
            console.error("Error updating payment for", email, updateError);
            results.mismatches.push({
              email,
              paycashlessAmount,
              paycashlessStatus,
              localAmount,
              localStatus,
              error: "Update failed",
            });
            continue;
          }

          results.updatedRecords++;
          results.updatedPayments.push({
            email,
            oldAmountPaid: localAmount,
            oldStatus: localStatus,
            newAmountPaid: paycashlessAmount,
            newStatus: correctStatus,
          });

          results.matchingRecords++;
        }
      }
    }

    // Log the sync activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "sync_all_payments",
      resource_type: "payment",
      resource_id: "bulk_sync",
      metadata: {
        results,
        paycashless_invoices_count: paycashlessInvoices.length,
        local_payments_count: localPayments?.length || 0,
        sync_timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Sync completed successfully",
      data: results,
    });
  } catch (error) {
    console.error("Sync all payments error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
