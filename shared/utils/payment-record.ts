import { supabaseAdmin } from "@/shared/config/supabase";
import {
  derivePaymentStatus,
  getAcademicSessionForDate,
  getFeeForSession,
} from "@/shared/config/academic-session";
import { sanitizeEmail } from "@/shared/utils/sanitize";

const PLACEHOLDER_PHONE = "0000000000";

export type SyncableInvoice = {
  id: string;
  reference?: string | null;
  status?: string;
  amount: number;
  totalPaid: number;
  customer?: {
    email?: string;
    phoneNumber?: string;
    name?: string;
  };
  createdAt?: string;
  paidAt?: string | null;
};

export type UpsertPaymentResult = {
  payment: Record<string, unknown>;
  action: "created" | "updated" | "unchanged" | "skipped_sponsored";
};

export function normalizePaymentPhone(phone: string): {
  phone?: string;
  error?: string;
} {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10) {
    return { error: "Phone number must have at least 10 digits" };
  }
  if (digits.length > 20) {
    return { error: "Phone number is too long (maximum 20 digits)" };
  }
  return { phone: digits };
}

function resolveEmail(invoice: SyncableInvoice, fallbackEmail?: string) {
  const raw = invoice.customer?.email || fallbackEmail || "";
  try {
    return sanitizeEmail(raw);
  } catch {
    const lowered = raw.trim().toLowerCase();
    return lowered.includes("@") ? lowered : "";
  }
}

function resolvePhone(invoice: SyncableInvoice, fallbackPhone?: string) {
  const fromInvoice = invoice.customer?.phoneNumber
    ? normalizePaymentPhone(invoice.customer.phoneNumber)
    : {};
  if (fromInvoice.phone) return fromInvoice.phone;

  if (fallbackPhone) {
    const fromFallback = normalizePaymentPhone(fallbackPhone);
    if (fromFallback.phone) return fromFallback.phone;
  }

  return PLACEHOLDER_PHONE;
}

function eventDate(invoice: SyncableInvoice) {
  const raw = invoice.paidAt || invoice.createdAt;
  const date = raw ? new Date(raw) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function findExistingPayment(invoice: SyncableInvoice, email: string) {
  if (invoice.id) {
    const { data: byPaycashlessId } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("paycashless_invoice_id", invoice.id)
      .maybeSingle();
    if (byPaycashlessId) return byPaycashlessId;

    const { data: byInvoiceId } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("invoice_id", invoice.id)
      .maybeSingle();
    if (byInvoiceId) return byInvoiceId;
  }

  if (invoice.reference) {
    const { data: byReference } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("invoice_id", invoice.reference)
      .maybeSingle();
    if (byReference) return byReference;
  }

  const sessionLabel = getAcademicSessionForDate(eventDate(invoice));
  const { data: pendingSameSession } = await supabaseAdmin
    .from("payments")
    .select("*")
    .ilike("email", email)
    .eq("session_label", sessionLabel)
    .is("paycashless_invoice_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return pendingSameSession || null;
}

export async function upsertPaymentFromInvoice(
  invoice: SyncableInvoice,
  options?: {
    fallbackEmail?: string;
    fallbackPhone?: string;
    touchWebhook?: boolean;
  }
): Promise<UpsertPaymentResult> {
  const email = resolveEmail(invoice, options?.fallbackEmail);
  if (!email) {
    throw new Error("Cannot save payment: invoice has no customer email");
  }

  const phone = resolvePhone(invoice, options?.fallbackPhone);
  const when = eventDate(invoice);
  const sessionLabel = getAcademicSessionForDate(when);
  const amountToPay =
    Number(invoice.amount) > 0
      ? Number(invoice.amount)
      : getFeeForSession(sessionLabel);
  const amountPaid = Math.max(0, Number(invoice.totalPaid) || 0);
  const status = derivePaymentStatus(amountPaid, amountToPay);
  const paidAt =
    status === "completed"
      ? invoice.paidAt
        ? new Date(invoice.paidAt).toISOString()
        : when.toISOString()
      : amountPaid > 0 && invoice.paidAt
        ? new Date(invoice.paidAt).toISOString()
        : null;
  const invoiceId = invoice.reference || invoice.id;
  const now = new Date().toISOString();

  const existing = await findExistingPayment(invoice, email);

  if (
    existing &&
    (existing.payment_source === "sponsored" ||
      existing.payment_source === "waived")
  ) {
    return { payment: existing, action: "skipped_sponsored" };
  }

  const nextRow = {
    email,
    phone: existing?.phone && existing.phone !== PLACEHOLDER_PHONE
      ? existing.phone
      : phone,
    amount_to_pay: amountToPay,
    amount_paid: amountPaid,
    invoice_id: existing?.invoice_id || invoiceId,
    paycashless_invoice_id: invoice.id,
    status,
    paid_at: paidAt,
    session_label: sessionLabel,
    payment_source: "paycashless",
    customer_name: invoice.customer?.name || existing?.customer_name || null,
    invoice_created_at: invoice.createdAt
      ? new Date(invoice.createdAt).toISOString()
      : existing?.invoice_created_at || null,
    invoice_paid_at: invoice.paidAt
      ? new Date(invoice.paidAt).toISOString()
      : null,
    updated_at: now,
    ...(options?.touchWebhook ? { last_webhook_update: now } : {}),
  };

  if (existing) {
    const unchanged =
      Number(existing.amount_paid || 0) === amountPaid &&
      existing.status === status &&
      Number(existing.amount_to_pay || 0) === amountToPay &&
      existing.session_label === sessionLabel &&
      existing.paycashless_invoice_id === invoice.id;

    if (unchanged) {
      return { payment: existing, action: "unchanged" };
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("payments")
      .update(nextRow)
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update payment from invoice:", updateError);
      throw new Error(updateError.message);
    }

    return { payment: updated, action: "updated" };
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from("payments")
    .insert(nextRow)
    .select()
    .single();

  if (insertError) {
    // Another request may have inserted the same invoice_id first.
    if (insertError.code === "23505" && invoiceId) {
      const { data: raced } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .maybeSingle();
      if (raced) {
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("payments")
          .update(nextRow)
          .eq("id", raced.id)
          .select()
          .single();
        if (!updateError && updated) {
          return { payment: updated, action: "updated" };
        }
      }
    }
    console.error("Failed to create payment from invoice:", insertError);
    throw new Error(insertError.message);
  }

  return { payment: created, action: "created" };
}
