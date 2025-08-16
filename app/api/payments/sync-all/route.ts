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
    console.log(`Found ${paycashlessInvoices.length} invoices on Paycashless`);

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

    console.log(`Found ${localPayments?.length || 0} local payments`);

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

    for (const paycashlessInvoice of paycashlessInvoices) {
      const email = paycashlessInvoice.customer?.email;
      if (!email) {
        console.log("Skipping invoice without email:", paycashlessInvoice.id);
        continue;
      }

      // Find matching local payment
      const localPayment = localPayments?.find(
        (p) => p.email === email || p.invoice_id === paycashlessInvoice.id
      );

      const paycashlessAmount = paycashlessInvoice.totalPaid || 0;
      const paycashlessStatus = paycashlessInvoice.status;
      const isFullyPaid = paycashlessAmount >= PAYMENT_CONFIG.amount;

      if (!localPayment) {
        // Create new payment record
        const newPayment = {
          email,
          phone: paycashlessInvoice.customer?.phoneNumber || "",
          amount_to_pay: PAYMENT_CONFIG.amount,
          amount_paid: paycashlessAmount,
          invoice_id: paycashlessInvoice.id,
          status: isFullyPaid ? "completed" : paycashlessAmount > 0 ? "partially_paid" : "pending",
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

        console.log(`Created new payment for ${email}: ₦${paycashlessAmount.toLocaleString()}`);
      } else {
        // Check if update is needed
        const localAmount = localPayment.amount_paid || 0;
        const localStatus = localPayment.status;
        const needsUpdate = 
          localAmount !== paycashlessAmount ||
          (isFullyPaid && localStatus !== "completed") ||
          (!isFullyPaid && paycashlessAmount > 0 && localStatus !== "partially_paid");

        if (needsUpdate) {
          // Update payment
          const newStatus = isFullyPaid ? "completed" : paycashlessAmount > 0 ? "partially_paid" : "pending";
          
          const updateData = {
            amount_paid: paycashlessAmount,
            status: newStatus,
            paid_at: isFullyPaid ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          };

          const { data: updatedPayment, error: updateError } = await supabaseAdmin
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
            newStatus,
          });

          console.log(`Updated payment for ${email}: ₦${localAmount.toLocaleString()} → ₦${paycashlessAmount.toLocaleString()}`);
        } else {
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
