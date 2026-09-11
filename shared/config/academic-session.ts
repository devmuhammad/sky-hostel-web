import { PAYMENT_CONFIG } from "@/shared/config/constants";

/**
 * Academic sessions run July (year Y) through May (year Y+1).
 * Label format: "Y/(Y+1)" e.g. "2026/2027".
 *
 * June is treated as the start of the upcoming session (pre-resumption /
 * registration window after the prior session ends in May).
 */

export const SESSION_FEES: Record<string, number> = {
  "2024/2025": 219000,
  "2025/2026": 219000,
  "2026/2027": 255700,
};

/** Default fee for unknown future sessions — fall back to current config. */
export function getFeeForSession(sessionLabel: string): number {
  if (SESSION_FEES[sessionLabel] != null) {
    return SESSION_FEES[sessionLabel];
  }
  return PAYMENT_CONFIG.amount;
}

export function getAcademicSessionForDate(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return getCurrentAcademicSession();
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

  // July–December → year/(year+1)
  if (month >= 7) {
    return `${year}/${year + 1}`;
  }

  // January–May → (year-1)/year
  if (month <= 5) {
    return `${year - 1}/${year}`;
  }

  // June → upcoming session year/(year+1)
  return `${year}/${year + 1}`;
}

export function getCurrentAcademicSession(now = new Date()): string {
  return getAcademicSessionForDate(now);
}

export function getSessionDateRange(sessionLabel: string): {
  start: Date;
  end: Date;
} | null {
  const match = /^(\d{4})\/(\d{4})$/.exec(sessionLabel);
  if (!match) return null;

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) return null;

  // July 1 startYear 00:00 → May 31 endYear 23:59:59.999
  const start = new Date(Date.UTC(startYear, 6, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(endYear, 4, 31, 23, 59, 59, 999));
  return { start, end };
}

export function derivePaymentStatus(
  amountPaid: number,
  amountToPay: number
): "pending" | "partially_paid" | "completed" {
  if (amountPaid <= 0) return "pending";
  if (amountPaid >= amountToPay) return "completed";
  return "partially_paid";
}

/**
 * Prefer paidAt, then invoice createdAt, for session + display timestamps.
 */
export function pickInvoiceEventDate(invoice: {
  paidAt?: string | null;
  createdAt?: string | null;
}): Date | null {
  const raw = invoice.paidAt || invoice.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
