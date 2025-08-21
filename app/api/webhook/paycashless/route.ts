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
    console.log("🔍 WEBHOOK DEBUG: Received webhook payload:", payload);

    // Webhook received

    const webhookData = payload.data || payload;
    const eventType = payload.event || "payment.updated";

    console.log("🔍 WEBHOOK DEBUG: Processing event:", {
      eventType,
      webhookData,
    });

    // Event type and webhook data processed

    // Handle different event types
    if (eventType === "INVOICE_PAYMENT") {
      console.log("🔍 WEBHOOK DEBUG: Handling INVOICE_PAYMENT event");
      return await handlePaymentSucceeded(webhookData, eventType);
    } else if (eventType === "INVOICE_PAID") {
      console.log("🔍 WEBHOOK DEBUG: Handling INVOICE_PAID event");
      return await handleInvoicePaid(webhookData);
    } else {
      // Log unhandled event types for monitoring
      console.log(
        "❌ WEBHOOK DEBUG: Unhandled webhook event type:",
        eventType,
        webhookData
      );
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

async function handlePaymentSucceeded(
  webhookData: PaycashlessWebhookData,
  eventType: string
) {
  // Handling INVOICE_PAYMENT (partial payments)
  console.log("🔍 WEBHOOK DEBUG: INVOICE_PAYMENT received:", {
    webhookData,
    eventType,
  });

  // Extract payment details
  const paymentAmount = webhookData.amount || webhookData.payment_amount || 0;
  const invoiceId =
    webhookData.invoice_id || webhookData.invoiceId || webhookData.id;
  const customerEmail = webhookData.customer?.email || webhookData.email;
  const customerPhone = webhookData.customer?.phoneNumber || webhookData.phone;

  console.log("🔍 WEBHOOK DEBUG: Extracted payment details:", {
    paymentAmount,
    invoiceId,
    customerEmail,
    customerPhone,
  });

  // Payment details extracted

  // Find existing payment
  const existingPayment = await findPaymentByInvoiceId(
    invoiceId!,
    customerEmail,
    customerPhone
  );

  console.log("🔍 WEBHOOK DEBUG: Payment lookup result:", {
    found: !!existingPayment,
    paymentId: existingPayment?.id,
    currentAmountPaid: existingPayment?.amount_paid,
    currentStatus: existingPayment?.status,
  });

  if (!existingPayment) {
    // Payment not found for invoice
    console.error("❌ WEBHOOK DEBUG: Payment not found for:", {
      invoiceId,
      customerEmail,
      customerPhone,
    });
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Update payment with partial payment amount
  const currentAmountPaid = existingPayment.amount_paid || 0;
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const totalAmount = existingPayment.amount_to_pay || PAYMENT_CONFIG.amount;

  console.log("🔍 WEBHOOK DEBUG: Payment calculation:", {
    currentAmountPaid,
    paymentAmount,
    newAmountPaid,
    totalAmount,
  });

  // Determine status based on total amount
  let newStatus = "pending";

  if (newAmountPaid >= totalAmount) {
    newStatus = "completed";
  } else if (newAmountPaid > 0) {
    newStatus = "partially_paid";
    // Partial payment received
  }

  console.log("🔍 WEBHOOK DEBUG: Status update:", {
    oldStatus: existingPayment.status,
    newStatus,
  });

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
      event_type: eventType, // Use the actual event type received
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
    event_type: eventType, // Use the actual event type received
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

  // FIXED: Update payment with full amount and completed status
  const totalAmount = existingPayment.amount_to_pay || PAYMENT_CONFIG.amount;
  const updateData = {
    amount_paid: totalAmount, // Set to full amount when invoice is fully paid
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
      old_amount_paid: existingPayment.amount_paid,
      new_amount_paid: totalAmount,
      old_status: existingPayment.status,
      new_status: "completed",
      webhook_data: webhookData,
      event_type: "INVOICE_PAID",
    },
  });

  return NextResponse.json({
    success: true,
    payment_id: existingPayment.id,
    old_amount_paid: existingPayment.amount_paid,
    new_amount_paid: totalAmount,
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
  // Paycashless sends their invoice ID (inv_...), but we store our SKY reference in invoice_id
  // So we need to find by email/phone instead

  // First try by customer email (most reliable)
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

  // If no payment found by email, try by phone number
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

  // As a last resort, try to find by invoice_id (in case it's our SKY reference)
  if (invoiceId && !invoiceId.startsWith("inv_")) {
    const { data: payment, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .single();

    if (payment && !error) {
      return payment;
    }
  }

  return null;
}
