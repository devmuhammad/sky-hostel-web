import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  findInvoicesForEmail,
  getAllPaycashlessInvoices,
  pickBestInvoice,
} from "@/shared/utils/paycashless";
import { upsertPaymentFromInvoice } from "@/shared/utils/payment-record";
import { sanitizeEmail } from "@/shared/utils/sanitize";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["super_admin", "admin"]);
    const body = await request.json();

    let email: string;
    try {
      email = sanitizeEmail(body.email || "");
    } catch {
      return NextResponse.json(
        { success: false, message: "A valid email is required" },
        { status: 400 }
      );
    }

    const paycashlessResult = await getAllPaycashlessInvoices({
      limit: 100,
    });

    if (!paycashlessResult.success || !paycashlessResult.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch invoices from Paycashless",
        },
        { status: 500 }
      );
    }

    const relevantInvoices = findInvoicesForEmail(
      paycashlessResult.data.invoices || [],
      email,
      body.phone
    );

    if (relevantInvoices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No invoices found for this email on Paycashless",
        },
        { status: 404 }
      );
    }

    const bestInvoice = pickBestInvoice(relevantInvoices);
    if (!bestInvoice) {
      return NextResponse.json(
        {
          success: false,
          message: "No invoices found for this email on Paycashless",
        },
        { status: 404 }
      );
    }

    const result = await upsertPaymentFromInvoice(bestInvoice, {
      fallbackEmail: email,
      fallbackPhone: typeof body.phone === "string" ? body.phone : undefined,
    });

    await supabaseAdmin.from("activity_logs").insert({
      action: "sync_paycashless_payment",
      resource_type: "payment",
      resource_id: result.payment.id,
      admin_user_id: admin.id,
      metadata: {
        email,
        action: result.action,
        invoice_id: bestInvoice.id,
        reference: bestInvoice.reference,
        amount_paid: bestInvoice.totalPaid,
        status: result.payment.status,
      },
    });

    const actionMessage =
      result.action === "created"
        ? "Created local payment record from Paycashless"
        : result.action === "updated"
          ? "Payment status synced with Paycashless"
          : result.action === "skipped_sponsored"
            ? "Left sponsored/waived payment unchanged"
            : "Payment status is already correct";

    return NextResponse.json({
      success: true,
      message: actionMessage,
      data: {
        email,
        action: result.action,
        paymentId: result.payment.id,
        oldStatus: result.action === "created" ? null : result.payment.status,
        newStatus: result.payment.status,
        newAmountPaid: result.payment.amount_paid,
        paycashlessInvoices: relevantInvoices.map((inv) => ({
          reference: inv.reference,
          status: inv.status,
          totalPaid: inv.totalPaid,
          amount: inv.amount,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Admin access required") ||
      message.includes("Insufficient permissions") ||
      message.includes("No authenticated user")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Payment sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
