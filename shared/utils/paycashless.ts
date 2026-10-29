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
import { getActiveSessionConfig } from "@/shared/utils/active-session";
import { upsertPaymentFromInvoice } from "@/shared/utils/payment-record";

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
  phone?: string,
  expectedAmount: number = PAYMENT_CONFIG.amount
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
    bestInvoice?: MappedPaycashlessInvoice;
  };
  error?: string;
}> {
  const dueAmount =
    Number.isFinite(expectedAmount) && expectedAmount > 0
      ? expectedAmount
      : PAYMENT_CONFIG.amount;

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

    const relevantInvoices = findInvoicesForEmail(invoices, email, phone);

    if (relevantInvoices.length === 0) {
      return {
        success: true,
        data: {
          totalPaid: 0,
          remainingAmount: dueAmount,
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

    relevantInvoices.forEach((invoice: MappedPaycashlessInvoice) => {
      const isActuallyPaid =
        invoice.status === "paid" ||
        invoice.status === "completed" ||
        invoice.status === "succeeded" ||
        ((invoice.totalPaid || 0) > 0 &&
          (invoice.totalPaid || 0) >= (invoice.amount || 0));

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
          paidAt: invoice.paidAt || undefined,
        });
      }
    });

    const remainingAmount = Math.max(0, dueAmount - totalPaid);
    const isFullyPaid = totalPaid >= dueAmount;
    const bestInvoice = pickBestInvoice(relevantInvoices);

    // If not fully paid, return error
    if (!isFullyPaid && totalPaid > 0) {
      return {
        success: false,
        error: `Payment incomplete. You have paid ₦${totalPaid.toLocaleString()} out of ₦${dueAmount.toLocaleString()}. Please complete your payment before registering.`,
        data: {
          totalPaid,
          remainingAmount,
          isFullyPaid,
          payment_id,
          payments,
          bestInvoice,
        },
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
        bestInvoice,
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
    payment_source?: string;
  };
  error?: string;
}> {
  try {
    const activeSession = await getActiveSessionConfig(supabaseAdmin);
    const sessionLabel = activeSession.label;
    const feeAmount = activeSession.feeAmount;

    // First, check if a student with this email already exists
    const { data: existingStudent, error: studentError } = await supabaseAdmin
      .from("students")
      .select(
        "id, email, first_name, last_name, is_active, account_status, bedspace_label, enrollment_session"
      )
      .ilike("email", email)
      .maybeSingle();

    if (studentError && studentError.code !== "PGRST116") {
      throw new Error("Failed to check existing student");
    }

    if (existingStudent) {
      if (
        existingStudent.is_active === false ||
        existingStudent.account_status === "blacklisted"
      ) {
        return {
          success: false,
          error:
            "This email is not eligible for hostel registration. Please contact the hostel office.",
        };
      }

      const alreadyPlaced = Boolean(existingStudent.bedspace_label);
      const enrolledThisSession =
        existingStudent.enrollment_session === sessionLabel;

      if (alreadyPlaced || enrolledThisSession) {
        return {
          success: false,
          error: `A student with email ${email} is already registered for ${sessionLabel}. Please contact support if you need assistance.`,
        };
      }
      // Returning student without a current bed — allow verify with this session's payment
    }

    // Sponsored / waived: trust a completed local payment for the active session
    const { data: localCompleted, error: localCompletedError } =
      await supabaseAdmin
        .from("payments")
        .select(
          "id, email, amount_paid, amount_to_pay, status, invoice_id, payment_source, paid_at, session_label"
        )
        .ilike("email", email)
        .eq("status", "completed")
        .eq("session_label", sessionLabel)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (localCompletedError && localCompletedError.code !== "PGRST116") {
      // Column may be missing before migration 13/14 — fall through to Paycashless
      console.warn("Local completed payment lookup:", localCompletedError);
    }

    if (localCompleted) {
      const totalPaid = Number(localCompleted.amount_paid) || feeAmount;
      return {
        success: true,
        data: {
          totalPaid,
          remainingAmount: 0,
          isFullyPaid: true,
          payment_id: localCompleted.id,
          payment_source: localCompleted.payment_source || "paycashless",
          payments: [
            {
              id: localCompleted.id,
              reference: localCompleted.invoice_id,
              amount: totalPaid,
              status: "completed",
              paidAt: localCompleted.paid_at || undefined,
            },
          ],
        },
      };
    }

    // Call the actual Paycashless API to get real payment data
    const paycashlessResult = await getPaycashlessPaymentStatus(
      email,
      phone,
      feeAmount
    );

    if (!paycashlessResult.success) {
      return {
        success: false,
        error: paycashlessResult.error || "Payment verification failed",
      };
    }

    if (!paycashlessResult.data?.isFullyPaid) {
      return paycashlessResult;
    }

    const invoiceToImport = paycashlessResult.data.bestInvoice;
    if (invoiceToImport && (invoiceToImport.totalPaid || 0) > 0) {
      try {
        const imported = await upsertPaymentFromInvoice(invoiceToImport, {
          fallbackEmail: email,
          fallbackPhone: phone,
        });
        return {
          success: true,
          data: {
            ...paycashlessResult.data,
            payment_id: imported.payment.id as string,
            payment_source: "paycashless",
          },
        };
      } catch (importError) {
        console.error("Failed to import paid Paycashless invoice:", importError);
      }
    }

    const { data: localPayment, error: localPaymentError } = await supabaseAdmin
      .from("payments")
      .select("id, email, amount_paid, status, invoice_id, session_label")
      .ilike("email", email)
      .eq("session_label", sessionLabel)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (localPaymentError && localPaymentError.code !== "PGRST116") {
      return {
        success: false,
        error: "Payment lookup failed",
      };
    }

    if (!localPayment) {
      return {
        success: false,
        error: `No ${sessionLabel} payment record found for this email`,
      };
    }

    return {
      success: true,
      data: {
        ...paycashlessResult.data,
        payment_id: localPayment.id,
        payment_source: "paycashless",
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
    invoices: MappedPaycashlessInvoice[];
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

      allInvoices.push(...(data.data || []).map(mapPaycashlessInvoice));

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
    bestInvoice?: MappedPaycashlessInvoice;
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

    const relevantInvoices = findInvoicesForEmail(invoices, email, phone);

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

    relevantInvoices.forEach((invoice: MappedPaycashlessInvoice) => {
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
          paidAt: invoice.paidAt || undefined,
        });
      }
    });

    const remainingAmount = Math.max(0, PAYMENT_CONFIG.amount - totalPaid);
    const isFullyPaid = totalPaid >= PAYMENT_CONFIG.amount;

    return {
      success: true,
      data: {
        totalPaid,
        remainingAmount,
        isFullyPaid,
        payment_id,
        payments,
        bestInvoice: pickBestInvoice(relevantInvoices),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export type MappedPaycashlessInvoice = ReturnType<typeof mapPaycashlessInvoice>;

/**
 * Normalizes a raw Paycashless invoice (amounts in kobo) into Naira amounts.
 * Accepts list items, single-invoice responses, and INVOICE_PAID webhook data.
 */
export function mapPaycashlessInvoice(invoice: PaycashlessInvoice) {
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
      email:
        returnUrlEmail || invoice.customer?.email || invoice.metadata?.email,
      phoneNumber: invoice.metadata?.phone || invoice.customer?.phoneNumber,
      name: extractNameFromMetadata(invoice.metadata) || invoice.customer?.name,
    },
    metadata: invoice.metadata,
    returnUrl: invoice.returnUrl,
    hostedInvoiceUrl: invoice.hostedInvoiceUrl,
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt || null,
    dueDate: invoice.dueDate,
    acceptPartialPayments: invoice.acceptPartialPayments,
  };
}

export function findInvoicesForEmail(
  invoices: MappedPaycashlessInvoice[],
  email: string,
  phone?: string
): MappedPaycashlessInvoice[] {
  const targetEmail = email.toLowerCase().trim();
  const targetPhone = phone ? phone.replace(/\D/g, "") : "";

  return invoices.filter((invoice) => {
    const emails = [
      invoice.customer?.email,
      invoice.metadata?.email,
    ].filter((value): value is string => Boolean(value));

    if (emails.some((value) => value.toLowerCase().trim() === targetEmail)) {
      return true;
    }

    if (!targetPhone) return false;

    const invoicePhone = (
      invoice.customer?.phoneNumber ||
      invoice.metadata?.phone ||
      ""
    ).replace(/\D/g, "");

    return Boolean(
      invoicePhone &&
        (invoicePhone === targetPhone ||
          invoicePhone.endsWith(targetPhone) ||
          targetPhone.endsWith(invoicePhone))
    );
  });
}

export function pickBestInvoice(
  invoices: MappedPaycashlessInvoice[]
): MappedPaycashlessInvoice | undefined {
  if (invoices.length === 0) return undefined;
  return [...invoices].sort((a, b) => {
    const paidDiff = (b.totalPaid || 0) - (a.totalPaid || 0);
    if (paidDiff !== 0) return paidDiff;
    return (
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  })[0];
}

export async function getPaycashlessInvoiceById(invoiceId: string): Promise<{
  success: boolean;
  data?: MappedPaycashlessInvoice;
  error?: string;
}> {
  if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
    return {
      success: false,
      error: "Paycashless API credentials are not configured",
    };
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const requestPath = `/v1/invoices/${encodeURIComponent(invoiceId)}`;
    const signature = generateRequestSignature(requestPath, {}, timestamp);

    const response = await fetch(`${PAYCASHLESS_API_URL}${requestPath}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
        "Request-Signature": signature,
        "Request-Timestamp": timestamp.toString(),
      },
    });

    if (response.ok) {
      const result = await response.json();
      const raw = (result?.data?.id ? result.data : result) as PaycashlessInvoice;
      if (raw?.id) {
        return { success: true, data: mapPaycashlessInvoice(raw) };
      }
    }
  } catch (error) {
    console.error("Paycashless invoice lookup error:", error);
  }

  // Fall back to the list endpoint, which is known to work with our signing.
  const since = Math.floor(Date.now() / 1000) - 120 * 24 * 60 * 60;
  const listResult = await getAllPaycashlessInvoices({
    limit: 100,
    createdAtGte: since,
  });
  if (!listResult.success || !listResult.data) {
    return { success: false, error: listResult.error || "Invoice lookup failed" };
  }

  const match = (listResult.data.invoices as MappedPaycashlessInvoice[]).find(
    (invoice) => invoice.id === invoiceId
  );
  return match
    ? { success: true, data: match }
    : { success: false, error: `Invoice ${invoiceId} not found on Paycashless` };
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
