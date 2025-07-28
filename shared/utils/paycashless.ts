import crypto from "crypto";
import { PaycashlessInvoiceRequest } from "@/shared/types/payment";
import { supabaseAdmin } from "@/shared/config/supabase";

import { paycashlessConfig } from "@/shared/config/env";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

const PAYCASHLESS_API_URL = paycashlessConfig.apiUrl;
const PAYCASHLESS_API_KEY = paycashlessConfig.apiKey;
const PAYCASHLESS_API_SECRET = paycashlessConfig.apiSecret;

function sha512Sign(message: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(message).digest("hex");
}

function sortObjectAlphabetically(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectAlphabetically);
  } else if (obj !== null && typeof obj === "object") {
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectAlphabetically(obj[key]);
      });
    return sorted;
  }
  return obj;
}

function generateRequestSignature(
  requestPath: string,
  body: any,
  timestamp: number
): string {
  if (!PAYCASHLESS_API_SECRET) {
    throw new Error("Paycashless API secret is not configured");
  }

  // Sort the body alphabetically
  const sortedBody = sortObjectAlphabetically(body);

  // Create the body hash
  const bodyHash = sha512Sign(
    JSON.stringify(sortedBody),
    PAYCASHLESS_API_SECRET
  );

  // Concatenate the string to sign
  const stringToSign = `${requestPath}${bodyHash}${timestamp}`;

  // Generate the signature
  return sha512Sign(stringToSign, PAYCASHLESS_API_SECRET);
}

export async function createPaycashlessInvoice(
  data: PaycashlessInvoiceRequest
): Promise<{
  success: boolean;
  data: {
    id: string;
    reference: string;
    paymentUrl: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    number: string;
  };
  message: string;
}> {
  if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
    throw new Error("Paycashless API credentials are not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const requestPath = "/v1/invoices";

  const requestBody = {
    reference: data.reference,
    description: data.description,
    currency: data.currency,
    customer: data.customer,
    items: data.items,
    daysUntilDue: data.daysUntilDue,
    acceptPartialPayments: data.acceptPartialPayments ?? false,
    sendEmail: data.sendEmail ?? false,
    autoFinalize: data.autoFinalize ?? true,
    callbackUrl: data.callbackUrl,
    returnUrl: data.returnUrl,
    maxInstallments: data.maxInstallments ?? 1,
    metadata: data.metadata,
  };

  const signature = generateRequestSignature(
    requestPath,
    requestBody,
    timestamp
  );

  try {
    const response = await fetch(`${PAYCASHLESS_API_URL}/v1/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
        "Request-Signature": signature,
        "Request-Timestamp": timestamp.toString(),
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Paycashless API error:", result);
      return {
        success: false,
        data: {
          id: "",
          reference: "",
          paymentUrl: "",
          amount: 0,
          currency: "",
          status: "",
          dueDate: "",
          number: "",
        },
        message: result.message || "Failed to create invoice",
      };
    }

    return {
      success: true,
      data: {
        id: result.id,
        reference: result.reference,
        paymentUrl: result.hostedInvoiceUrl,
        amount: result.amountDue,
        currency: result.currency,
        status: result.status,
        dueDate: result.dueDate,
        number: result.number,
      },
      message: "Invoice created successfully",
    };
  } catch (error) {
    console.error("Paycashless invoice creation error:", error);
    return {
      success: false,
      data: {
        id: "",
        reference: "",
        paymentUrl: "",
        amount: 0,
        currency: "",
        status: "",
        dueDate: "",
        number: "",
      },
      message:
        error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
}

export async function verifyPaycashlessPayment(
  email: string,
  phone?: string
): Promise<{
  success: boolean;
  data?: {
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    payment_id?: string;
    payments: Array<{
      id: string;
      reference: string;
      amount: number;
      status: string;
      paidAt?: string;
    }>;
  };
  error?: string;
}> {
  try {
    // First, check if a student with this email already exists
    const { data: existingStudent, error: studentError } = await supabaseAdmin
      .from("students")
      .select("id, email, first_name, last_name")
      .eq("email", email)
      .single();

    if (studentError && studentError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if no student exists
      throw new Error("Failed to check existing student");
    }

    if (existingStudent) {
      return {
        success: false,
        error: `A student with email ${email} is already registered. Please contact support if you need assistance.`,
      };
    }

    // First, get all payments from our database for this user
    const { data: localPayments, error: dbError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`email.eq.${email}${phone ? `,phone.eq.${phone}` : ""}`)
      .order("created_at", { ascending: false });

    if (dbError) {
      throw new Error("Failed to fetch payment records");
    }

    if (!localPayments || localPayments.length === 0) {
      return {
        success: true,
        data: {
          totalPaid: 0,
          remainingAmount: PAYMENT_CONFIG.amount,
          isFullyPaid: false,
          payment_id: undefined,
          payments: [],
        },
      };
    }

    // Calculate totals from local payments (webhooks keep these accurate)
    let totalPaid = 0;
    let payment_id: string | undefined;
    const completedPayments = localPayments
      .filter(
        (payment) =>
          payment.status === "completed" ||
          (payment.status === "pending" && payment.amount_paid > 0)
      )
      .map((payment) => {
        // Use the stored amount_paid, but if it's 0 or null, use the configured amount
        const paymentAmount =
          payment.amount_paid > 0 ? payment.amount_paid : PAYMENT_CONFIG.amount;
        totalPaid += paymentAmount;

        // Use the first completed payment's ID as the payment_id
        if (!payment_id) {
          payment_id = payment.id;
        }

        return {
          id: payment.id,
          reference: payment.invoice_id,
          amount: paymentAmount,
          status: payment.status,
          paidAt: payment.paid_at,
        };
      });

    // Check for pending payments that might need webhook confirmation
    const pendingPayments = localPayments.filter(
      (payment) => payment.status === "pending" && payment.amount_paid === 0
    );
    if (pendingPayments.length > 0) {
      console.log(
        "Found pending payments that may need webhook confirmation:",
        pendingPayments
      );
      console.log(
        "Payment is still pending - webhook may not have updated yet"
      );
    }

    const remainingAmount = Math.max(0, PAYMENT_CONFIG.amount - totalPaid);
    const isFullyPaid = totalPaid >= PAYMENT_CONFIG.amount;

    return {
      success: true,
      data: {
        totalPaid,
        remainingAmount,
        isFullyPaid,
        payment_id,
        payments: completedPayments,
      },
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Payment verification failed",
    };
  }
}

export function validatePaycashlessWebhook(payload: any): boolean {
  return payload && (payload.invoice_id || payload.id) && payload.status;
}
