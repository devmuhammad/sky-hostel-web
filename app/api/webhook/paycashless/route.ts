import { NextRequest, NextResponse } from "next/server";
import { validatePaycashlessWebhook } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PaycashlessWebhookPayload } from "@/shared/types/payment";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Debug logging
    console.log("=== PAYCASHLESS WEBHOOK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Handle the nested webhook structure
    const webhookData = payload.data || payload; // Support both formats
    const eventType = payload.event;

    console.log("Event:", eventType);
    console.log("Status:", webhookData.status);
    console.log("Reference:", webhookData.reference);
    console.log("Invoice ID:", webhookData.id);

    // Basic validation - ensure we have required fields
    if (!webhookData.status || !webhookData.reference) {
      console.error(
        "Invalid webhook payload - missing required fields:",
        payload
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload - missing status or reference",
        },
        { status: 400 }
      );
    }

    // Update payment status in database
    // Use the reference from the nested data structure
    const invoiceReference = webhookData.reference;

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

    // Update payment status using the nested data
    const newStatus =
      webhookData.status === "paid"
        ? "completed"
        : webhookData.status === "partially_paid"
          ? "pending" // Keep as pending until fully paid
          : webhookData.status === "cancelled"
            ? "failed"
            : "pending";

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: newStatus,
        paid_at:
          webhookData.status === "paid" ? new Date().toISOString() : null,
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
        event_type: eventType,
        invoice_id: webhookData.id,
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
