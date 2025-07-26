import { NextRequest, NextResponse } from "next/server";
import { validatePaycashlessWebhook } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PaycashlessWebhookPayload } from "@/shared/types/payment";

export async function POST(request: NextRequest) {
  try {
    const payload: PaycashlessWebhookPayload = await request.json();

    // Validate webhook payload
    if (!validatePaycashlessWebhook(payload)) {
      console.error("Invalid webhook payload:", payload);
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Update payment status in database
    // Handle both invoice_id and reference field from webhook
    const invoiceReference = payload.invoice_id || payload.reference;

    const { data: existingPayment, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceReference)
      .single();

    if (fetchError || !existingPayment) {
      console.error("Payment not found:", invoiceReference, fetchError);
      return NextResponse.json(
        { success: false, error: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status
    const newStatus =
      payload.status === "paid"
        ? "completed"
        : payload.status === "partially_paid"
          ? "pending" // Keep as pending until fully paid
          : payload.status === "cancelled"
            ? "failed"
            : "pending";

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: newStatus,
        paid_at: payload.status === "paid" ? new Date().toISOString() : null,
      })
      .eq("invoice_id", invoiceReference);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "payment_status_updated",
      resource_type: "payment",
      resource_id: existingPayment.id,
      metadata: {
        old_status: existingPayment.status,
        new_status: newStatus,
        transaction_id: payload.transaction_id,
        webhook_payload: payload,
      },
    });

    console.log(`Payment ${invoiceReference} updated to ${newStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
