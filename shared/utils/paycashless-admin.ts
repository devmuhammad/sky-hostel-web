import crypto from "crypto";
import { paycashlessConfig } from "@/shared/config/env";

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
    const objRecord = obj as Record<string, unknown>;
    Object.keys(objRecord)
      .sort()
      .forEach((key) => {
        sorted[key] = sortObjectAlphabetically(objRecord[key] as Record<string, unknown>);
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

  const sortedBody = sortObjectAlphabetically(body);
  const bodyHash = sha512Sign(
    JSON.stringify(sortedBody),
    PAYCASHLESS_API_SECRET
  );
  const stringToSign = `${requestPath}${bodyHash}${timestamp}`;
  return sha512Sign(stringToSign, PAYCASHLESS_API_SECRET);
}

export interface PaycashlessInvoice {
  id: string;
  reference: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  customer: {
    email: string;
    name: string;
  };
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface PaycashlessPayment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt?: string;
}

export async function listPaycashlessInvoices(params?: {
  limit?: number;
  status?: string;
  reference?: string;
}): Promise<{
  success: boolean;
  data?: PaycashlessInvoice[];
  error?: string;
}> {
  if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
    return {
      success: false,
      error: "Paycashless API credentials are not configured",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const requestPath = "/v1/invoices";

  try {
    const url = new URL(`${PAYCASHLESS_API_URL}/v1/invoices`);
    if (params?.limit)
      url.searchParams.append("limit", params.limit.toString());
    if (params?.status) url.searchParams.append("status", params.status);
    if (params?.reference)
      url.searchParams.append("reference", params.reference);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
        "Request-Timestamp": timestamp.toString(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to fetch invoices",
      };
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch invoices",
    };
  }
}

export async function getPaycashlessInvoicePayments(
  invoiceId: string
): Promise<{
  success: boolean;
  data?: PaycashlessPayment[];
  error?: string;
}> {
  if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
    return {
      success: false,
      error: "Paycashless API credentials are not configured",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const requestPath = `/v1/invoices/${invoiceId}/payments`;

  try {
    const response = await fetch(
      `${PAYCASHLESS_API_URL}/v1/invoices/${invoiceId}/payments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
          "Request-Timestamp": timestamp.toString(),
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to fetch invoice payments",
      };
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch invoice payments",
    };
  }
}

export async function cancelPaycashlessInvoice(
  invoiceId: string,
  reason: string
): Promise<{
  success: boolean;
  data?: PaycashlessInvoice;
  error?: string;
}> {
  if (!PAYCASHLESS_API_KEY || !PAYCASHLESS_API_SECRET) {
    return {
      success: false,
      error: "Paycashless API credentials are not configured",
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const requestPath = `/v1/invoices/${invoiceId}/cancel`;

  const requestBody = {
    cancellationReason: reason,
  };

  const signature = generateRequestSignature(
    requestPath,
    requestBody,
    timestamp
  );

  try {
    const response = await fetch(
      `${PAYCASHLESS_API_URL}/v1/invoices/${invoiceId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PAYCASHLESS_API_KEY}`,
          "Request-Signature": signature,
          "Request-Timestamp": timestamp.toString(),
        },
        body: JSON.stringify(requestBody),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || "Failed to cancel invoice",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to cancel invoice",
    };
  }
}
