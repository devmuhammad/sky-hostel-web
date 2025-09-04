import crypto from "crypto";
import {
  PaycashlessInvoiceRequest,
  PaycashlessInvoiceResponse,
  PaycashlessInvoice,
  PaycashlessWebhookPayload,
} from "@/shared/types/payment";
import { supabaseAdmin } from "@/shared/config/supabase";

import { paycashlessConfig } from "@/shared/config/env";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

const PAYCASHLESS_API_URL = paycashlessConfig.apiUrl;
const PAYCASHLESS_API_KEY = paycashlessConfig.apiKey;
const PAYCASHLESS_API_SECRET = paycashlessConfig.apiSecret;

function sha512Sign(message: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(message).digest("hex");
}

function sortObjectAlphabetically(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectAlphabetically);
  } else if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    Object.keys(obj as Record<string, unknown>)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectAlphabetically(
          (obj as Record<string, unknown>)[key]
        );
      });
    return sorted;
  }
  return obj;
}

function generateRequestSignature(
  requestPath: string,
  body: Record<string, unknown>,
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
): Promise<PaycashlessInvoiceResponse> {
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

export async function getPaycashlessPaymentStatus(
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
    if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
      throw new Error("Paycashless API credentials are not configured");
    }

    // Use the working getAllPaycashlessInvoices function directly
    const listResult = await getAllPaycashlessInvoices({
      limit: 100,
    });

    if (!listResult.success || !listResult.data) {
      return {
        success: false,
        error: listResult.error || "Failed to fetch invoices from Paycashless",
      };
    }

    const invoices = listResult.data.invoices || [];

    // Filter for invoices related to this email
    const relevantInvoices = invoices.filter((invoice: any) => {
      const metadataEmail = invoice.metadata?.email;
      const customerEmail = invoice.customer?.email;
      const returnUrlEmail = extractEmailFromReturnUrl(invoice.returnUrl);

      return (
        metadataEmail === email ||
        customerEmail === email ||
        returnUrlEmail === email
      );
    });

    if (relevantInvoices.length === 0) {
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

    // Calculate totals from relevant invoices
    let totalPaid = 0;
    let payment_id: string | undefined;
    const payments: Array<{
      id: string;
      reference: string;
      amount: number;
      status: string;
      paidAt?: string;
    }> = [];

    relevantInvoices.forEach((invoice: any) => {
      const isActuallyPaid =
        invoice.status === "paid" ||
        invoice.status === "completed" ||
        invoice.status === "succeeded" ||
        ((invoice.totalPaid || 0) > 0 &&
          (invoice.totalPaid || 0) >= invoice.amountDue);

      const rawAmount = invoice.totalPaid || 0;
      const amountPaid = isActuallyPaid ? rawAmount : 0; // Data is already in Naira

      totalPaid += amountPaid;

      if (amountPaid > 0) {
        if (!payment_id) {
          payment_id = invoice.id;
        }

        payments.push({
          id: invoice.id,
          reference: invoice.reference,
          amount: amountPaid,
          status: invoice.status,
          paidAt: invoice.paidAt,
        });
      }
    });

    const remainingAmount = Math.max(0, PAYMENT_CONFIG.amount - totalPaid);
    const isFullyPaid = totalPaid >= PAYMENT_CONFIG.amount;

    // If not fully paid, return error
    if (!isFullyPaid && totalPaid > 0) {
      return {
        success: false,
        error: `Payment incomplete. You have paid ₦${totalPaid.toLocaleString()} out of ₦${PAYMENT_CONFIG.amount.toLocaleString()}. Please complete your payment before registering.`,
      };
    }

    return {
      success: true,
      data: {
        totalPaid,
        remainingAmount,
        isFullyPaid,
        payment_id,
        payments,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Paycashless data",
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

    // Call the actual Paycashless API to get real payment data
    const paycashlessResult = await getPaycashlessPaymentStatus(email, phone);

    if (!paycashlessResult.success) {
      // Return the actual error message from Paycashless instead of generic message
      return {
        success: false,
        error: paycashlessResult.error || "Payment verification failed",
      };
    }

    // If payment is not fully paid, return the error
    if (!paycashlessResult.data?.isFullyPaid) {
      return paycashlessResult;
    }

    // Payment is fully paid, now find the local payment record

    // Look up local payment record by email
    const { data: localPayment, error: localPaymentError } = await supabaseAdmin
      .from("payments")
      .select("id, email, amount_paid, status, invoice_id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (localPaymentError && localPaymentError.code !== "PGRST116") {
      return {
        success: false,
        error: "Payment lookup failed",
      };
    }

    if (!localPayment) {
      return {
        success: false,
        error: "No payment record found for this email",
      };
    }

    // Return the Paycashless data but with the local payment UUID
    return {
      success: true,
      data: {
        ...paycashlessResult.data,
        payment_id: localPayment.id, // Use local payment UUID instead of Paycashless invoice ID
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Payment verification failed",
    };
  }
}

export async function getAllPaycashlessInvoices(params?: {
  limit?: number;
  cursor?: string;
  status?: string[];
  currency?: string[];
  reference?: string;
  acceptPartialPayments?: boolean | null;
  number?: string;
  createdAtGte?: number;
  createdAtLte?: number;
  createdAtLt?: number;
  createdAtGt?: number;
}): Promise<{
  success: boolean;
  data?: {
    hasMore: boolean;
    cursor: string | null;
    invoices: Array<{
      id: string;
      reference: string;
      number: string;
      status: string;
      currency: string;
      amount: number;
      totalPaid: number;
      remainingAmount: number;
      customer: {
        email?: string;
        phoneNumber?: string;
        name?: string;
      };
      createdAt: string;
      dueDate: string;
      acceptPartialPayments: boolean;
    }>;
  };
  error?: string;
}> {
  try {
    if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
      return {
        success: false,
        error:
          "Paycashless API credentials are not configured. Please check your environment variables.",
      };
    }

    const allInvoices: any[] = [];
    let hasMore = true;
    let cursor: string | null = null;
    let pageCount = 0;
    const maxPages = 50;

    while (hasMore && pageCount < maxPages) {
      pageCount++;

      const timestamp = Math.floor(Date.now() / 1000);
      const requestPath = "/v1/invoices";

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (cursor) queryParams.append("cursor", cursor);
      if (params?.status)
        params.status.forEach((s) => queryParams.append("status", s));
      if (params?.currency)
        params.currency.forEach((c) => queryParams.append("currency", c));
      if (params?.reference) queryParams.append("reference", params.reference);
      if (params?.acceptPartialPayments !== undefined)
        queryParams.append(
          "acceptPartialPayments",
          params.acceptPartialPayments?.toString() || "false"
        );
      if (params?.number) queryParams.append("number", params.number);
      if (params?.createdAtGte)
        queryParams.append("createdAt.gte", params.createdAtGte.toString());
      if (params?.createdAtLte)
        queryParams.append("createdAt.lte", params.createdAtLte.toString());
      if (params?.createdAtLt)
        queryParams.append("createdAt.lt", params.createdAtLt.toString());
      if (params?.createdAtGt)
        queryParams.append("createdAt.gt", params.createdAtGt.toString());

      const queryString = queryParams.toString();
      const fullPath = queryString
        ? `${requestPath}?${queryString}`
        : requestPath;

      const basePath = "/v1/invoices";
      const signature = generateRequestSignature(basePath, {}, timestamp);

      const response = await fetch(`${PAYCASHLESS_API_URL}${fullPath}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
          "Request-Signature": signature,
          "Request-Timestamp": timestamp.toString(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          return {
            success: false,
            error:
              "PayCashless API authentication failed. Please check your API key and secret.",
          };
        }

        throw new Error(
          `PayCashless API error: ${response.status} - ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();

      // Add invoices from this page
      const pageInvoices = data.data.map((invoice: PaycashlessInvoice) => {
        // Extract email from returnUrl properly
        const returnUrlEmail = extractEmailFromReturnUrl(invoice.returnUrl);

        return {
          id: invoice.id,
          reference: invoice.reference,
          number: invoice.number,
          status: invoice.status,
          currency: invoice.currency,
          amount: (invoice.amountDue || invoice.amount || 0) / 100,
          totalPaid: (invoice.amountPaid || invoice.totalPaid || 0) / 100,
          remainingAmount:
            (invoice.amountRemaining || invoice.remainingAmount || 0) / 100,
          customer: {
            email: returnUrlEmail || invoice.customer?.email,
            phoneNumber:
              invoice.metadata?.phone || invoice.customer?.phoneNumber,
            name: extractNameFromMetadata(invoice.metadata),
          },
          createdAt: invoice.createdAt,
          dueDate: invoice.dueDate,
          acceptPartialPayments: invoice.acceptPartialPayments,
        };
      });

      allInvoices.push(...pageInvoices);

      // Check if there are more pages
      hasMore = data.hasMore || false;
      cursor = data.cursor || null;

      if (hasMore && cursor) {
      }
    }

    return {
      success: true,
      data: {
        hasMore: false, // We've fetched everything
        cursor: null,
        invoices: allInvoices,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getPaycashlessPaymentStatusForManualCheck(
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
    if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
      throw new Error("Paycashless API credentials are not configured");
    }

    // Fetch ALL invoices without limit to ensure we don't miss any
    const listResult = await getAllPaycashlessInvoices({
      limit: 100, // PayCashless maximum limit is 100
    });

    if (!listResult.success || !listResult.data) {
      return {
        success: false,
        error: listResult.error || "Failed to fetch invoices from Paycashless",
      };
    }

    const invoices = listResult.data.invoices || [];

    const relevantInvoices = invoices.filter((invoice: any) => {
      const metadataEmail = invoice.metadata?.email;
      const customerEmail = invoice.customer?.email;
      const returnUrlEmail = extractEmailFromReturnUrl(invoice.returnUrl);
      const metadataPhone = invoice.metadata?.phone;

      const normalizedSearchEmail = email.toLowerCase().trim();
      const normalizedMetadataEmail = metadataEmail?.toLowerCase().trim();
      const normalizedCustomerEmail = customerEmail?.toLowerCase().trim();
      const normalizedReturnUrlEmail = returnUrlEmail?.toLowerCase().trim();

      if (normalizedMetadataEmail === normalizedSearchEmail) {
        return true;
      }

      if (normalizedCustomerEmail === normalizedSearchEmail) {
        return true;
      }

      if (normalizedReturnUrlEmail === normalizedSearchEmail) {
        return true;
      }

      if (phone && metadataPhone) {
        const normalizedSearchPhone = phone.replace(/\D/g, "");
        const normalizedMetadataPhone = metadataPhone.replace(/\D/g, "");

        if (
          normalizedSearchPhone === normalizedMetadataPhone ||
          normalizedSearchPhone.includes(normalizedMetadataPhone) ||
          normalizedMetadataPhone.includes(normalizedSearchPhone)
        ) {
          return true;
        }
      }

      if (
        normalizedMetadataEmail &&
        normalizedMetadataEmail.includes(normalizedSearchEmail.split("@")[0])
      ) {
        return true;
      }

      if (
        normalizedReturnUrlEmail &&
        normalizedReturnUrlEmail.includes(normalizedSearchEmail.split("@")[0])
      ) {
        return true;
      }

      return false;
    });

    if (relevantInvoices.length === 0) {
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

    let totalPaid = 0;
    let payment_id: string | undefined;
    const payments: Array<{
      id: string;
      reference: string;
      amount: number;
      status: string;
      paidAt?: string;
    }> = [];

    relevantInvoices.forEach((invoice: any) => {
      const isActuallyPaid =
        invoice.status === "paid" ||
        invoice.status === "completed" ||
        invoice.status === "succeeded" ||
        (invoice.totalPaid || 0) > 0;

      const rawAmount = invoice.totalPaid || 0;
      const amountPaid = isActuallyPaid ? rawAmount : 0; // Data is already in Naira

      totalPaid += amountPaid;

      if (amountPaid > 0) {
        if (!payment_id) {
          payment_id = invoice.id;
        }

        payments.push({
          id: invoice.id,
          reference: invoice.reference,
          amount: amountPaid,
          status: invoice.status,
          paidAt: invoice.paidAt,
        });
      }
    });

    const remainingAmount = Math.max(0, PAYMENT_CONFIG.amount - totalPaid);
    const isFullyPaid = totalPaid >= PAYMENT_CONFIG.amount;

    const result = {
      success: true,
      data: {
        totalPaid,
        remainingAmount,
        isFullyPaid,
        payment_id,
        payments,
      },
    };

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function extractEmailFromReturnUrl(returnUrl?: string): string | undefined {
  if (!returnUrl) return undefined;

  try {
    const url = new URL(returnUrl);
    const email = url.searchParams.get("email");
    if (email) {
      return decodeURIComponent(email);
    }

    const pathParts = url.pathname.split("/");
    for (const part of pathParts) {
      if (part.includes("@") && part.includes(".")) {
        return decodeURIComponent(part);
      }
    }

    return undefined;
  } catch (error) {
    console.error("Error parsing returnUrl:", error);
    return undefined;
  }
}

function extractNameFromMetadata(
  metadata?: Record<string, unknown>
): string | undefined {
  if (!metadata) return undefined;

  const firstName = (metadata.firstName as string)?.trim() || "";
  const lastName = (metadata.lastName as string)?.trim() || "";

  return firstName || lastName ? `${firstName} ${lastName}`.trim() : undefined;
}

export function verifyWebhookSignature(
  payload: PaycashlessWebhookPayload,
  signature: string,
  timestamp: string,
  apiSecret: string
): boolean {
  try {
    const bodyHash = sha512Sign(JSON.stringify(payload.data), apiSecret);
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`;
    const stringToSign = `${callbackUrl}${bodyHash}${timestamp}`;

    const expectedSignature = sha512Sign(stringToSign, apiSecret);

    return signature === expectedSignature;
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}
