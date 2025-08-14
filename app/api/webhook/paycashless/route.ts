import { NextRequest, NextResponse } from "next/server";
import { validatePaycashlessWebhook } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PaycashlessWebhookData } from "@/shared/types/payment";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

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
    // Webhook received

    const webhookData = payload.data || payload;
    const eventType = payload.event || "payment.updated";

      // Event type and webhook data processed

    // Handle different event types
    if (eventType === "INVOICE_PAYMENT_SUCCEEDED") {
      return await handlePaymentSucceeded(webhookData);
    } else if (eventType === "INVOICE_PAID") {
      return await handleInvoicePaid(webhookData);
    } else {
      // Unhandled event type
      return NextResponse.json({
        success: true,
        message: "Event type not handled",
        event_type: eventType,
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(webhookData: PaycashlessWebhookData) {
  // Handling INVOICE_PAYMENT_SUCCEEDED

  // Extract payment details
  const paymentAmount = webhookData.amount || webhookData.payment_amount || 0;
  const invoiceId =
    webhookData.invoice_id || webhookData.invoiceId || webhookData.id;
  const customerEmail = webhookData.customer?.email || webhookData.email;
  const customerPhone = webhookData.customer?.phoneNumber || webhookData.phone;

  // Payment details extracted

  // Find existing payment
  const existingPayment = await findPaymentByInvoiceId(
    invoiceId!,
    customerEmail,
    customerPhone
  );

  if (!existingPayment) {
    // Payment not found for invoice
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Update payment with partial payment amount
  const currentAmountPaid = existingPayment.amount_paid || 0;
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const totalAmount = existingPayment.amount_to_pay || PAYMENT_CONFIG.amount;

  // Determine status based on total amount
  let newStatus = "pending";

  if (newAmountPaid >= totalAmount) {
    newStatus = "completed";
  } else if (newAmountPaid > 0) {
    newStatus = "partially_paid";
    // Partial payment received
  }

  const updateData = {
    amount_paid: newAmountPaid,
    status: newStatus,
    paid_at:
      newStatus === "completed"
        ? new Date().toISOString()
        : existingPayment.paid_at,
  };

  // Updating payment

  const { data: updatedPayment, error: updateError } = await supabaseAdmin
    .from("payments")
    .update(updateData)
    .eq("id", existingPayment.id)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update payment:", updateError);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }

  // Log the activity
  await supabaseAdmin.from("activity_logs").insert({
    action: "partial_payment_received",
    resource_type: "payment",
    resource_id: existingPayment.id,
    metadata: {
      old_amount_paid: currentAmountPaid,
      new_amount_paid: newAmountPaid,
      payment_amount: paymentAmount,
      old_status: existingPayment.status,
      new_status: newStatus,
      webhook_data: webhookData,
      event_type: "INVOICE_PAYMENT_SUCCEEDED",
    },
  });

  return NextResponse.json({
    success: true,
    payment_id: existingPayment.id,
    old_amount_paid: currentAmountPaid,
    new_amount_paid: newAmountPaid,
    payment_amount: paymentAmount,
    old_status: existingPayment.status,
    new_status: newStatus,
    updated_at: updatedPayment.updated_at,
    event_type: "INVOICE_PAYMENT_SUCCEEDED",
  });
}

async function handleInvoicePaid(webhookData: PaycashlessWebhookData) {
  // Handling INVOICE_PAID

  // Extract payment details
  const invoiceId =
    webhookData.invoice_id || webhookData.invoiceId || webhookData.id;
  const customerEmail = webhookData.customer?.email || webhookData.email;
  const customerPhone = webhookData.customer?.phoneNumber || webhookData.phone;

  // Invoice paid details extracted

  // Find existing payment
  const existingPayment = await findPaymentByInvoiceId(
    invoiceId!,
    customerEmail,
    customerPhone
  );

  if (!existingPayment) {
    // Payment not found for invoice
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Update payment status to completed
  const updateData = {
    status: "completed",
    paid_at: new Date().toISOString(),
  };

  // Marking payment as completed

  const { data: updatedPayment, error: updateError } = await supabaseAdmin
    .from("payments")
    .update(updateData)
    .eq("id", existingPayment.id)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to update payment:", updateError);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }

  // Log the activity
  await supabaseAdmin.from("activity_logs").insert({
    action: "invoice_fully_paid",
    resource_type: "payment",
    resource_id: existingPayment.id,
    metadata: {
      old_status: existingPayment.status,
      new_status: "completed",
      webhook_data: webhookData,
      event_type: "INVOICE_PAID",
    },
  });

  return NextResponse.json({
    success: true,
    payment_id: existingPayment.id,
    old_status: existingPayment.status,
    new_status: "completed",
    updated_at: updatedPayment.updated_at,
    event_type: "INVOICE_PAID",
  });
}

async function findPaymentByInvoiceId(
  invoiceId: string,
  customerEmail?: string,
  customerPhone?: string
) {
  // First try to find by invoice_id (most reliable)
  if (invoiceId) {
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .single();

    if (payment && !error) {
      return payment;
    }
  }

  // If no payment found by reference, try by customer email
  if (customerEmail) {
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("email", customerEmail)
      .order("created_at", { ascending: false })
      .limit(1);

    if (payments && payments.length > 0) {
      return payments[0];
    }
  }

  // If still no payment found, try by phone number
  if (customerPhone) {
    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("phone", customerPhone)
      .order("created_at", { ascending: false })
      .limit(1);

    if (payments && payments.length > 0) {
      return payments[0];
    }
  }

  return null;
}
