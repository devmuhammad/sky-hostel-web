import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  PaycashlessWebhookPayload,
  PaycashlessPaymentSucceededData,
  PaycashlessInvoicePaidData,
} from "@/shared/types/payment";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

export async function GET() {
  return NextResponse.json({
    message: "Webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    const payload = JSON.parse(rawBody) as PaycashlessWebhookPayload;

    const signature = request.headers.get("Request-Signature");
    const timestamp = request.headers.get("Request-Timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(
      payload,
      signature,
      timestamp,
      process.env.PAYCASHLESS_API_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { event, data } = payload;

    if (!event || !data) {
      return NextResponse.json(
        { error: "Invalid webhook structure" },
        { status: 400 }
      );
    }

    switch (event) {
      case "INVOICE_PAYMENT_SUCCEEDED":
        return await handleInvoicePaymentSucceeded(
          data as PaycashlessPaymentSucceededData
        );

      case "INVOICE_PAID":
        return await handleInvoicePaid(data as PaycashlessInvoicePaidData);

      default:
        return NextResponse.json({
          success: true,
          message: "Event type not handled",
          event_type: event,
        });
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleInvoicePaymentSucceeded(
  webhookData: PaycashlessPaymentSucceededData
) {
  const invoiceId = webhookData.invoiceId;
  const rawPaymentAmount = webhookData.amountPaid;
  const paymentAmount = rawPaymentAmount / 100; // Convert kobo to Naira

  if (!invoiceId) {
    return NextResponse.json(
      { error: "No invoice ID provided" },
      { status: 400 }
    );
  }

  const existingPayment = await findPaymentByInvoiceId(invoiceId);

  if (!existingPayment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const currentAmountPaid = existingPayment.amount_paid || 0;
  const newAmountPaid = currentAmountPaid + paymentAmount;
  const totalAmount = existingPayment.amount_to_pay || PAYMENT_CONFIG.amount;

  let newStatus = "pending";
  if (newAmountPaid >= totalAmount) {
    newStatus = "completed";
  } else if (newAmountPaid > 0) {
    newStatus = "partially_paid";
  }

  const updateData = {
    amount_paid: newAmountPaid,
    status: newStatus,
    paid_at:
      newStatus === "completed"
        ? new Date().toISOString()
        : existingPayment.paid_at,
    last_webhook_update: new Date().toISOString(),
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
      invoice_id: invoiceId,
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
    invoice_id: invoiceId,
  });
}

async function handleInvoicePaid(webhookData: PaycashlessInvoicePaidData) {
  const reference = webhookData.reference;

  if (!reference) {
    return NextResponse.json(
      { error: "No reference provided" },
      { status: 400 }
    );
  }

  const existingPayment = await findPaymentByReference(reference);

  if (!existingPayment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const totalAmount = existingPayment.amount_to_pay || PAYMENT_CONFIG.amount;

  const updateData = {
    amount_paid: totalAmount,
    status: "completed",
    paid_at: new Date().toISOString(),
    last_webhook_update: new Date().toISOString(),
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
      reference: reference,
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
    reference: reference,
  });
}

async function findPaymentByReference(reference: string) {
  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("invoice_id", reference)
    .single();

  if (payment && !error) {
    return payment;
  }

  return null;
}

async function findPaymentByInvoiceId(invoiceId: string) {
  const { data: payment, error } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("paycashless_invoice_id", invoiceId)
    .single();

  if (payment && !error) {
    return payment;
  }

  return null;
}
