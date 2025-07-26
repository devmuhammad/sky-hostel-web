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
    description: data.description || "Sky Student Hostel Payment",
    currency: "NGN",
    customer: {
      email: data.email,
      name: data.name,
      address: "Sky Student Hostel, University Campus Area",
    },
    items: [
      {
        name: "Hostel Accommodation Fee",
        description: "Annual accommodation fee for Sky Student Hostel",
        price: PAYMENT_CONFIG.amountInKobo, // Amount in kobo
        quantity: 1,
      },
    ],
    daysUntilDue: 7,
    acceptPartialPayments: true,
    sendEmail: true,
    autoFinalize: true,
    maxInstallments: 3,
    callbackUrl: data.callbackUrl,
    returnUrl: data.returnUrl,
    metadata: data.metadata || {},
  };

  const signature = generateRequestSignature(
    requestPath,
    requestBody,
    timestamp
  );

  // Log the request details for debugging
  console.log("=== Paycashless Invoice Request ===");
  console.log("API URL:", `${PAYCASHLESS_API_URL}${requestPath}`);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${PAYCASHLESS_API_URL}${requestPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
        "Request-Signature": signature,
        "Request-Timestamp": timestamp.toString(),
      },
      body: JSON.stringify(requestBody),
    });

    console.log("=== Paycashless Invoice Response ===");
    console.log("Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log("Error Response:", JSON.stringify(errorData, null, 2));
      throw new Error(
        `Paycashless API error: ${response.status} - ${errorData.error?.message || "Unknown error"}`
      );
    }

    const result = await response.json();
    console.log("Success Response:", JSON.stringify(result, null, 2));

    if (!result.hostedInvoiceUrl) {
      throw new Error("No payment URL received from Paycashless");
    }

    return {
      success: true,
      data: {
        id: result.id,
        reference: result.reference,
        paymentUrl: result.hostedInvoiceUrl,
        amount: result.amountDue / 100, // Convert back from kobo
        currency: result.currency,
        status: result.status,
        dueDate: result.dueDate,
        number: result.number,
      },
      message: "Invoice created successfully",
    };
  } catch (error) {
    console.error("Paycashless invoice error:", error);
    throw error;
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
          payments: [],
        },
      };
    }

    // Calculate totals from local payments (webhooks keep these accurate)
    let totalPaid = 0;
    const completedPayments = localPayments
      .filter((payment) => payment.status === "completed")
      .map((payment) => {
        totalPaid += payment.amount_paid;
        return {
          id: payment.id,
          reference: payment.invoice_id,
          amount: payment.amount_paid,
          status: payment.status,
          paidAt: payment.paid_at,
        };
      });

    const remainingAmount = Math.max(0, PAYMENT_CONFIG.amount - totalPaid);
    const isFullyPaid = totalPaid >= PAYMENT_CONFIG.amount;

    return {
      success: true,
      data: {
        totalPaid,
        remainingAmount,
        isFullyPaid,
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
