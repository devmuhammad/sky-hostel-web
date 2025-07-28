import { NextRequest, NextResponse } from "next/server";
import { validatePaycashlessWebhook } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PaycashlessWebhookPayload } from "@/shared/types/payment";

export async function GET() {
  return NextResponse.json({
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const webhookData = payload.data || payload;
    const eventType = payload.event || "payment.updated";

    // Validate webhook signature (if needed)
    // const signature = request.headers.get("x-paycashless-signature");
    // if (!validateSignature(payload, signature)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Find existing payment by reference
    const possibleReferences = [
      webhookData.reference,
      webhookData.id,
      webhookData.invoice_id,
      webhookData.invoiceId,
    ].filter(Boolean);

    let existingPayment = null;
    let reference = null;

    // First try to find by invoice_id (most reliable)
    for (const ref of possibleReferences) {
      const { data: payment, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("invoice_id", ref)
        .single();

      if (payment && !error) {
        existingPayment = payment;
        reference = ref;
        break;
      }
    }

    // If no payment found by reference, try by customer email
    if (!existingPayment && webhookData.customer?.email) {
      const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("email", webhookData.customer.email)
        .order("created_at", { ascending: false })
        .limit(1);

      if (payments && payments.length > 0) {
        existingPayment = payments[0];
        reference = existingPayment.invoice_id;
      }
    }

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Map webhook status to our status
    let newStatus = "pending";
    if (webhookData.status === "paid") {
      newStatus = "completed";
    } else if (webhookData.status === "partially_paid") {
      newStatus = "partially_paid";
    } else if (webhookData.status === "cancelled") {
      newStatus = "cancelled";
    }

    // Update payment status
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: newStatus,
        paid_at:
          webhookData.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("id", existingPayment.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
