import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";
import {
  derivePaymentStatus,
  getAcademicSessionForDate,
  getFeeForSession,
  pickInvoiceEventDate,
} from "@/shared/config/academic-session";

/**
 * Super-admin: re-date local payments from Paycashless invoice timestamps,
 * fix amount_to_pay / status using the fee for that session, and set
 * session_label. Does NOT delete any rows.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["super_admin"]);
    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body.dry_run);

    const paycashlessResult = await getAllPaycashlessInvoices({ limit: 100 });
    if (!paycashlessResult.success || !paycashlessResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: paycashlessResult.error || "Failed to fetch Paycashless invoices",
        },
        { status: 500 }
      );
    }

    const invoices = paycashlessResult.data.invoices || [];

    const { data: localPayments, error: localError } = await supabaseAdmin
      .from("payments")
      .select(
        "id, email, invoice_id, paycashless_invoice_id, amount_paid, amount_to_pay, status, created_at, paid_at, session_label, payment_source"
      );

    if (localError) {
      return NextResponse.json(
        { success: false, error: "Failed to load local payments" },
        { status: 500 }
      );
    }

    const byInvoiceId = new Map<string, any>();
    for (const inv of invoices) {
      if (inv?.id) byInvoiceId.set(inv.id, inv);
      if (inv?.reference) byInvoiceId.set(inv.reference, inv);
    }

    // Group invoices by email for fallback match when local invoice_id drifted
    const byEmail = new Map<string, any[]>();
    for (const inv of invoices) {
      const email = (inv.customer?.email || "").toLowerCase();
      if (!email) continue;
      if (!byEmail.has(email)) byEmail.set(email, []);
      byEmail.get(email)!.push(inv);
    }

    const results = {
      dry_run: dryRun,
      invoices_fetched: invoices.length,
      local_payments: localPayments?.length || 0,
      matched: 0,
      updated: 0,
      skipped_no_match: 0,
      skipped_sponsored: 0,
      samples: [] as any[],
    };

    for (const payment of localPayments || []) {
      if (
        payment.payment_source === "sponsored" ||
        payment.payment_source === "waived"
      ) {
        // Still tag session from paid_at/created_at if missing
        const eventDate = payment.paid_at
          ? new Date(payment.paid_at)
          : payment.created_at
            ? new Date(payment.created_at)
            : new Date();
        const sessionLabel = getAcademicSessionForDate(eventDate);
        const fee = getFeeForSession(sessionLabel);
        const amountPaid = Number(payment.amount_paid) || 0;
        const status = derivePaymentStatus(amountPaid, fee);

        if (!dryRun) {
          await supabaseAdmin
            .from("payments")
            .update({
              session_label: sessionLabel,
              amount_to_pay: fee,
              status,
            })
            .eq("id", payment.id);
        }

        results.skipped_sponsored++;
        results.updated++;
        continue;
      }

      let invoice =
        (payment.paycashless_invoice_id &&
          byInvoiceId.get(payment.paycashless_invoice_id)) ||
        (payment.invoice_id && byInvoiceId.get(payment.invoice_id)) ||
        null;

      if (!invoice) {
        const emailInvoices = byEmail.get((payment.email || "").toLowerCase()) || [];
        if (emailInvoices.length === 1) {
          invoice = emailInvoices[0];
        } else if (emailInvoices.length > 1) {
          // Prefer invoice whose paid amount matches local amount_paid
          invoice =
            emailInvoices.find(
              (inv) =>
                Math.abs((inv.totalPaid || 0) - (Number(payment.amount_paid) || 0)) < 1
            ) ||
            emailInvoices.sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            )[0];
        }
      }

      if (!invoice) {
        // No Paycashless match — still assign session from local timestamps
        const eventDate = payment.paid_at
          ? new Date(payment.paid_at)
          : payment.created_at
            ? new Date(payment.created_at)
            : new Date();
        const sessionLabel = getAcademicSessionForDate(eventDate);
        const fee = getFeeForSession(sessionLabel);
        const amountPaid = Number(payment.amount_paid) || 0;
        const status = derivePaymentStatus(amountPaid, fee);

        if (!dryRun) {
          await supabaseAdmin
            .from("payments")
            .update({
              session_label: sessionLabel,
              amount_to_pay: fee,
              status,
            })
            .eq("id", payment.id);
        }

        results.skipped_no_match++;
        results.updated++;
        if (results.samples.length < 15) {
          results.samples.push({
            email: payment.email,
            mode: "local_timestamps_only",
            session_label: sessionLabel,
            amount_to_pay: fee,
            status,
          });
        }
        continue;
      }

      results.matched++;

      const eventDate =
        pickInvoiceEventDate(invoice) ||
        (payment.paid_at ? new Date(payment.paid_at) : null) ||
        (payment.created_at ? new Date(payment.created_at) : new Date());

      const sessionLabel = getAcademicSessionForDate(eventDate);
      // Prefer invoice due amount when present; else session fee map
      const invoiceDue = Number(invoice.amount) || 0;
      const fee =
        invoiceDue > 0 ? invoiceDue : getFeeForSession(sessionLabel);
      const amountPaid =
        Number(invoice.totalPaid) >= 0
          ? Number(invoice.totalPaid)
          : Number(payment.amount_paid) || 0;
      const status = derivePaymentStatus(amountPaid, fee);

      const invoiceCreatedAt = invoice.createdAt
        ? new Date(invoice.createdAt).toISOString()
        : null;
      const invoicePaidAt = invoice.paidAt
        ? new Date(invoice.paidAt).toISOString()
        : null;
      const paidAt =
        invoicePaidAt ||
        (amountPaid > 0 ? eventDate.toISOString() : null);

      const updatePayload: Record<string, unknown> = {
        session_label: sessionLabel,
        amount_to_pay: fee,
        amount_paid: amountPaid,
        status,
        paid_at: paidAt,
        invoice_created_at: invoiceCreatedAt,
        invoice_paid_at: invoicePaidAt,
        // Restore chronological created_at from the invoice (no delete)
        created_at: invoiceCreatedAt || eventDate.toISOString(),
      };

      if (!dryRun) {
        const { error: updateError } = await supabaseAdmin
          .from("payments")
          .update(updatePayload)
          .eq("id", payment.id);

        if (updateError) {
          console.error("Reconcile update failed", payment.id, updateError);
          continue;
        }
      }

      results.updated++;
      if (results.samples.length < 20) {
        results.samples.push({
          email: payment.email,
          invoice_id: invoice.id,
          session_label: sessionLabel,
          amount_paid: amountPaid,
          amount_to_pay: fee,
          status,
          created_at: updatePayload.created_at,
          paid_at: paidAt,
        });
      }
    }

    if (!dryRun) {
      await supabaseAdmin.from("activity_logs").insert({
        action: "payments_session_reconcile",
        resource_type: "payment",
        resource_id: admin.id,
        admin_user_id: admin.id,
        metadata: {
          ...results,
          samples: results.samples.slice(0, 10),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: dryRun
        ? "Dry run complete — no rows written"
        : "Payments re-dated and session-tagged from Paycashless invoices",
    });
  } catch (error) {
    console.error("Payment reconcile error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or reconcile failed" },
      { status: 401 }
    );
  }
}
