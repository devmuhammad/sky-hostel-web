import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import {
  createPaycashlessInvoice,
  getAllPaycashlessInvoices,
  getPaycashlessInvoiceById,
} from "@/shared/utils/paycashless";
import { withRateLimit, rateLimiters } from "@/shared/utils/rate-limit";
import { sanitizeEmail } from "@/shared/utils/sanitize";
import { getActiveSessionConfig } from "@/shared/utils/active-session";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  normalizePaymentPhone,
  upsertPaymentFromInvoice,
} from "@/shared/utils/payment-record";

interface PaymentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(["super_admin", "admin", "porter", "other"]);
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");

    let query = supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (session && session !== "all") {
      query = query.eq("session_label", session);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, payments: data || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const data: PaymentData = await request.json();

    const requiredFields = ["firstName", "lastName", "email", "phone"];
    for (const field of requiredFields) {
      if (!data[field as keyof PaymentData]) {
        return NextResponse.json(
          { success: false, error: { message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    let normalizedEmail: string;
    try {
      normalizedEmail = sanitizeEmail(data.email);
    } catch {
      return NextResponse.json(
        { success: false, error: { message: "Invalid email format" } },
        { status: 400 }
      );
    }

    const phoneResult = normalizePaymentPhone(data.phone);
    if (!phoneResult.phone) {
      return NextResponse.json(
        {
          success: false,
          error: { message: phoneResult.error || "Invalid phone number" },
        },
        { status: 400 }
      );
    }
    const normalizedPhone = phoneResult.phone;
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();

    const activeSession = await getActiveSessionConfig(supabaseAdmin);
    const amount = activeSession.feeAmount;
    const amountInKobo = Math.round(amount * 100);
    const sessionLabel = activeSession.label;

    // Hard server-side stop: don't allow new invoices while an admin has
    // marked registration as closed, even if someone bypasses the UI.
    const { data: registrationSetting } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "registration_open")
      .single();

    if (registrationSetting && registrationSetting.value === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Registration is currently closed. Please check back later.",
          },
        },
        { status: 403 }
      );
    }

    // Block blacklisted / already-placed students from creating new invoices
    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select(
        "id, is_active, account_status, bedspace_label, enrollment_session"
      )
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (
      existingStudent &&
      (existingStudent.is_active === false ||
        existingStudent.account_status === "blacklisted")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "This email is not eligible for hostel registration. Please contact the hostel office.",
          },
        },
        { status: 403 }
      );
    }

    if (
      existingStudent &&
      (existingStudent.bedspace_label ||
        existingStudent.enrollment_session === sessionLabel)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `This email is already registered for ${sessionLabel}.`,
          },
        },
        { status: 400 }
      );
    }

    // Check payments for this email in the active session only
    const { data: existingPayments, error: checkError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .ilike("email", normalizedEmail)
      .eq("session_label", sessionLabel)
      .order("created_at", { ascending: false });

    if (checkError) {
      console.error("Existing payment lookup failed:", checkError);
      return NextResponse.json(
        { success: false, error: { message: "Payment initiation failed" } },
        { status: 500 }
      );
    }

    const completedPayment = existingPayments?.find(
      (p) => p.status === "completed"
    );
    if (completedPayment) {
      const sponsored =
        completedPayment.payment_source === "sponsored" ||
        completedPayment.payment_source === "waived";
      return NextResponse.json(
        {
          success: false,
          error: {
            message: sponsored
              ? `Payment for ${sessionLabel} has already been waived/sponsored. Go to registration to pick a room.`
              : `A payment for session ${sessionLabel} has already been completed for this email (${normalizedEmail}). Please contact support if you need assistance.`,
          },
        },
        { status: 400 }
      );
    }

    const existingPayment = existingPayments?.[0] || null;
    const reference =
      existingPayment?.invoice_id ||
      `SKY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const invoiceContext = {
      reference,
      normalizedEmail,
      normalizedPhone,
      firstName,
      lastName,
      amount,
      amountInKobo,
      sessionLabel,
    };

    if (existingPayment) {
      return await resumeExistingPayment(existingPayment, invoiceContext);
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        email: normalizedEmail,
        phone: normalizedPhone,
        amount_to_pay: amount,
        amount_paid: 0,
        invoice_id: reference,
        status: "pending",
        session_label: sessionLabel,
        payment_source: "paycashless",
        customer_name: `${firstName} ${lastName}`,
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error("Payment record creation error:", paymentError);
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Could not start payment. Please try again or contact the hostel office.",
          },
        },
        { status: 500 }
      );
    }

    return await attachPaycashlessInvoice(payment, invoiceContext);
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Payment initiation failed" } },
      { status: 500 }
    );
  }
}

type InvoiceContext = {
  reference: string;
  normalizedEmail: string;
  normalizedPhone: string;
  firstName: string;
  lastName: string;
  amount: number;
  amountInKobo: number;
  sessionLabel: string;
};

function alreadyPaidResponse(email: string, sessionLabel: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message: `A payment for session ${sessionLabel} has already been completed for this email (${email}). Go to registration to pick a room.`,
      },
    },
    { status: 400 }
  );
}

async function resumeExistingPayment(
  existingPayment: Record<string, unknown> & {
    id: string;
    invoice_id: string;
    paycashless_invoice_id?: string | null;
    payment_source?: string | null;
  },
  context: InvoiceContext
) {
  if (
    existingPayment.payment_source === "sponsored" ||
    existingPayment.payment_source === "waived"
  ) {
    return alreadyPaidResponse(context.normalizedEmail, context.sessionLabel);
  }

  if (existingPayment.paycashless_invoice_id) {
    const fetched = await getPaycashlessInvoiceById(
      String(existingPayment.paycashless_invoice_id)
    );
    if (fetched.success && fetched.data) {
      if ((fetched.data.totalPaid || 0) >= context.amount) {
        await upsertPaymentFromInvoice(fetched.data, {
          fallbackEmail: context.normalizedEmail,
          fallbackPhone: context.normalizedPhone,
        });
        return alreadyPaidResponse(
          context.normalizedEmail,
          context.sessionLabel
        );
      }
      if (fetched.data.hostedInvoiceUrl) {
        return NextResponse.json({
          success: true,
          data: {
            payment_id: existingPayment.id,
            invoice_id: fetched.data.id,
            invoice_reference: fetched.data.reference,
            payment_url: fetched.data.hostedInvoiceUrl,
            amount: context.amount,
            status: fetched.data.status,
          },
        });
      }
    }
  }

  return await attachPaycashlessInvoice(existingPayment, context);
}

async function attachPaycashlessInvoice(
  payment: { id: string; invoice_id: string },
  context: InvoiceContext
) {
  const invoice = await createOrReusePaycashlessInvoice(context);

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "We saved your application but could not reach the payment provider. Please try again with the same email.",
        },
      },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({
      paycashless_invoice_id: invoice.id,
      invoice_id: invoice.reference || payment.invoice_id,
      customer_name: `${context.firstName} ${context.lastName}`,
      invoice_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error(
      "Failed to attach Paycashless invoice id; webhook can still recover via SKY reference:",
      updateError
    );
  }

  await supabaseAdmin.from("activity_logs").insert({
    action: "payment_initiated",
    resource_type: "payment",
    resource_id: payment.id,
    metadata: {
      amount: context.amount,
      email: context.normalizedEmail,
      phone: context.normalizedPhone,
      invoice_id: invoice.id,
      reference: invoice.reference || context.reference,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      payment_id: payment.id,
      invoice_id: invoice.id,
      invoice_reference: invoice.reference || context.reference,
      payment_url: invoice.paymentUrl,
      amount: context.amount,
      status: invoice.status,
      due_date: invoice.dueDate,
    },
  });
}

async function createOrReusePaycashlessInvoice(context: InvoiceContext) {
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/registration?email=${encodeURIComponent(
    context.normalizedEmail
  )}&phone=${encodeURIComponent(context.normalizedPhone)}&firstName=${encodeURIComponent(
    context.firstName
  )}&lastName=${encodeURIComponent(context.lastName)}`;
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`;

  const invoiceResult = await createPaycashlessInvoice({
    reference: context.reference,
    description: `Sky Student Hostel Payment - ${context.firstName} ${context.lastName}`,
    currency: "NGN",
    customer: {
      email: context.normalizedEmail,
      name: `${context.firstName} ${context.lastName}`,
      address: "Sky Student Hostel, University Campus Area",
    },
    items: [
      {
        name: "Hostel Accommodation Fee",
        description: `Annual accommodation fee for Sky Student Hostel (${context.sessionLabel})`,
        price: context.amountInKobo,
        quantity: 1,
      },
    ],
    daysUntilDue: 65,
    acceptPartialPayments: true,
    sendEmail: true,
    autoFinalize: true,
    maxInstallments: 2,
    callbackUrl,
    returnUrl,
    metadata: {
      phone: context.normalizedPhone,
      firstName: context.firstName,
      lastName: context.lastName,
      orderType: "hostel_payment",
    },
  });

  if (invoiceResult.success && invoiceResult.data?.id) {
    return invoiceResult.data;
  }

  const listed = await getAllPaycashlessInvoices({
    reference: context.reference,
    limit: 10,
  });
  const match = listed.data?.invoices?.find(
    (invoice) => invoice.reference === context.reference
  );
  if (!match) {
    console.error("Paycashless invoice create failed:", invoiceResult.message);
    return null;
  }

  let paymentUrl = match.hostedInvoiceUrl || "";
  if (!paymentUrl) {
    const fetched = await getPaycashlessInvoiceById(match.id);
    paymentUrl = fetched.data?.hostedInvoiceUrl || "";
  }

  return {
    id: match.id,
    reference: match.reference,
    paymentUrl,
    amount: match.amount,
    currency: match.currency,
    status: match.status,
    dueDate: match.dueDate,
    number: match.number,
  };
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(rateLimiters.payment, handlePOST);
