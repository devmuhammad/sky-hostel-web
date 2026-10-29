import { NextRequest, NextResponse } from "next/server";
import {
  getPaycashlessInvoiceById,
  mapPaycashlessInvoice,
  verifyWebhookSignature,
} from "@/shared/utils/paycashless";
import { upsertPaymentFromInvoice } from "@/shared/utils/payment-record";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  PaycashlessWebhookPayload,
  PaycashlessPaymentSucceededData,
  PaycashlessInvoicePaidData,
  PaycashlessInvoice,
} from "@/shared/types/payment";

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

  if (!invoiceId) {
    return NextResponse.json(
      { error: "No invoice ID provided" },
      { status: 400 }
    );
  }

  const fetched = await getPaycashlessInvoiceById(invoiceId);
  if (!fetched.success || !fetched.data) {
    // Ask Paycashless to retry until we can read the invoice and create the row.
    return NextResponse.json(
      { error: fetched.error || "Invoice not found" },
      { status: 500 }
    );
  }

  return syncInvoiceFromWebhook(fetched.data, "INVOICE_PAYMENT_SUCCEEDED");
}

async function handleInvoicePaid(webhookData: PaycashlessInvoicePaidData) {
  const mapped = mapPaycashlessInvoice(
    webhookData as unknown as PaycashlessInvoice
  );
  return syncInvoiceFromWebhook(mapped, "INVOICE_PAID");
}

async function syncInvoiceFromWebhook(
  invoice: Parameters<typeof upsertPaymentFromInvoice>[0],
  eventType: string
) {
  const result = await upsertPaymentFromInvoice(invoice, {
    touchWebhook: true,
  });

  await supabaseAdmin.from("activity_logs").insert({
    action:
      result.action === "created"
        ? "payment_recovered_from_webhook"
        : eventType === "INVOICE_PAID"
          ? "invoice_fully_paid"
          : "partial_payment_received",
    resource_type: "payment",
    resource_id: result.payment.id,
    metadata: {
      event_type: eventType,
      action: result.action,
      invoice_id: invoice.id,
      reference: invoice.reference,
      amount_paid: invoice.totalPaid,
      status: result.payment.status,
    },
  });

  return NextResponse.json({
    success: true,
    payment_id: result.payment.id,
    action: result.action,
    new_amount_paid: result.payment.amount_paid,
    new_status: result.payment.status,
    event_type: eventType,
    invoice_id: invoice.id,
  });
}
