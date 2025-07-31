import { NextRequest, NextResponse } from "next/server";
import { validatePaycashlessWebhook } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PaycashlessWebhookPayload } from "@/shared/types/payment";

export async function GET() {
  return NextResponse.json({
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    environment: {
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      node_env: process.env.NODE_ENV,
    },
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`,
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
      // Add more possible fields that Paycashless might send
      webhookData.payment_reference,
      webhookData.transaction_id,
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

    // If still no payment found, try by phone number
    if (!existingPayment && webhookData.customer?.phoneNumber) {
      const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("phone", webhookData.customer.phoneNumber)
        .order("created_at", { ascending: false })
        .limit(1);

      if (payments && payments.length > 0) {
        existingPayment = payments[0];
        reference = existingPayment.invoice_id;
      }
    }

    // If still no payment found, try by any email in the payload
    if (!existingPayment && webhookData.email) {
      const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("email", webhookData.email)
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
    const updateData = {
      status: newStatus,
      paid_at: webhookData.status === "paid" ? new Date().toISOString() : null,
    };

    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from("payments")
      .update(updateData)
      .eq("id", existingPayment.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "payment_status_updated_via_webhook",
      resource_type: "payment",
      resource_id: existingPayment.id,
      metadata: {
        old_status: existingPayment.status,
        new_status: newStatus,
        webhook_status: webhookData.status,
        webhook_data: webhookData,
        reference: reference,
      },
    });

    return NextResponse.json({
      success: true,
      payment_id: existingPayment.id,
      old_status: existingPayment.status,
      new_status: newStatus,
      updated_at: updatedPayment.updated_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
