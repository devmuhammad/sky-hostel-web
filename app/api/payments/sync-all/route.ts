import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";
import {
  derivePaymentStatus,
  getAcademicSessionForDate,
  getCurrentAcademicSession,
  getFeeForSession,
  getSessionDateRange,
  pickInvoiceEventDate,
} from "@/shared/config/academic-session";

/**
 * Sync All — UPDATE ONLY.
 * Never creates local rows from historical Paycashless invoices.
 * Prefers matching current-session invoices; uses real invoice dates for
 * amount_to_pay / status / paid_at when updating.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["super_admin", "admin"]);
    const body = await request.json().catch(() => ({}));

    const currentSession =
      typeof body.session === "string" && body.session
        ? body.session
        : getCurrentAcademicSession();
    const sessionRange = getSessionDateRange(currentSession);

    const paycashlessResult = await getAllPaycashlessInvoices({
      limit: 100,
      createdAtGte: sessionRange
        ? Math.floor(sessionRange.start.getTime() / 1000)
        : undefined,
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

    const { data: localPayments, error: localError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (localError) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch local payments" },
        { status: 500 }
      );
    }

    const results = {
      mode: "update_only",
      session: currentSession,
      totalPaycashlessInvoices: paycashlessInvoices.length,
      matchingRecords: 0,
      updatedRecords: 0,
      skippedNoLocal: 0,
      skippedSponsored: 0,
      updatedPayments: [] as any[],
      unmatchedEmails: [] as string[],
    };

    // Best invoice per email (highest paid, then newest)
    const emailToInvoiceMap = new Map<string, any>();
    for (const paycashlessInvoice of paycashlessInvoices) {
      const email = paycashlessInvoice.customer?.email;
      if (!email) continue;

      const existingInvoice = emailToInvoiceMap.get(email);
      if (!existingInvoice) {
        emailToInvoiceMap.set(email, paycashlessInvoice);
        continue;
      }

      const existingAmount = existingInvoice.totalPaid || 0;
      const currentAmount = paycashlessInvoice.totalPaid || 0;
      if (currentAmount > existingAmount) {
        emailToInvoiceMap.set(email, paycashlessInvoice);
      } else if (currentAmount === existingAmount) {
        if (
          new Date(paycashlessInvoice.createdAt || 0) >
          new Date(existingInvoice.createdAt || 0)
        ) {
          emailToInvoiceMap.set(email, paycashlessInvoice);
        }
      }
    }

    for (const [email, paycashlessInvoice] of emailToInvoiceMap) {
      let localPayment = localPayments?.find(
        (p) =>
          p.invoice_id === paycashlessInvoice.id ||
          p.paycashless_invoice_id === paycashlessInvoice.id ||
          p.invoice_id === paycashlessInvoice.reference
      );

      if (!localPayment) {
        localPayment = localPayments?.find(
          (p) => (p.email || "").toLowerCase() === email.toLowerCase()
        );
      }

      if (!localPayment) {
        results.skippedNoLocal++;
        if (results.unmatchedEmails.length < 50) {
          results.unmatchedEmails.push(email);
        }
        continue;
      }

      if (
        localPayment.payment_source === "sponsored" ||
        localPayment.payment_source === "waived"
      ) {
        results.skippedSponsored++;
        continue;
      }

      const eventDate =
        pickInvoiceEventDate(paycashlessInvoice) ||
        (localPayment.paid_at ? new Date(localPayment.paid_at) : null) ||
        new Date();
      const sessionLabel = getAcademicSessionForDate(eventDate);
      const invoiceDue = Number(paycashlessInvoice.amount) || 0;
      const amountToPay =
        invoiceDue > 0 ? invoiceDue : getFeeForSession(sessionLabel);
      const paycashlessAmount = Number(paycashlessInvoice.totalPaid) || 0;
      const correctStatus = derivePaymentStatus(paycashlessAmount, amountToPay);
      const paidAt = paycashlessInvoice.paidAt
        ? new Date(paycashlessInvoice.paidAt).toISOString()
        : paycashlessAmount > 0
          ? eventDate.toISOString()
          : null;

      const needsUpdate =
        Number(localPayment.amount_paid || 0) !== paycashlessAmount ||
        localPayment.status !== correctStatus ||
        Number(localPayment.amount_to_pay || 0) !== amountToPay ||
        localPayment.session_label !== sessionLabel;

      if (!needsUpdate) {
        results.matchingRecords++;
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          amount_paid: paycashlessAmount,
          amount_to_pay: amountToPay,
          status: correctStatus,
          paid_at: paidAt,
          session_label: sessionLabel,
          invoice_created_at: paycashlessInvoice.createdAt
            ? new Date(paycashlessInvoice.createdAt).toISOString()
            : null,
          invoice_paid_at: paycashlessInvoice.paidAt
            ? new Date(paycashlessInvoice.paidAt).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", localPayment.id);

      if (updateError) {
        console.error("Sync update failed", email, updateError);
        continue;
      }

      results.updatedRecords++;
      results.matchingRecords++;
      results.updatedPayments.push({
        email,
        oldAmountPaid: localPayment.amount_paid,
        oldStatus: localPayment.status,
        newAmountPaid: paycashlessAmount,
        newStatus: correctStatus,
        session_label: sessionLabel,
      });
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "sync_all_payments",
      resource_type: "payment",
      resource_id: admin.id,
      admin_user_id: admin.id,
      metadata: {
        results: {
          ...results,
          updatedPayments: results.updatedPayments.slice(0, 20),
          unmatchedEmails: results.unmatchedEmails.slice(0, 20),
        },
        sync_timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Sync completed (update-only, session ${currentSession}). ${results.skippedNoLocal} Paycashless invoice(s) had no local payment and were not imported.`,
      data: results,
    });
  } catch (error) {
    console.error("Sync all payments error:", error);
    return NextResponse.json(
      { success: false, message: "Unauthorized or internal error" },
      { status: 401 }
    );
  }
}
