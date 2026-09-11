import { supabaseAdmin } from "@/shared/config/supabase";
import {
  getCurrentAcademicSession,
  getFeeForSession,
} from "@/shared/config/academic-session";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

export const ACTIVE_SESSION_SETTING_KEY = "active_academic_session";

export type ActiveSessionConfig = {
  label: string;
  feeAmount: number;
  openedAt: string | null;
  openedBy: string | null;
  source: "settings" | "calendar";
};

type SupabaseLike = {
  from: (table: string) => any;
};

type StoredSessionValue = {
  label?: string;
  fee_amount?: number;
  opened_at?: string | null;
  opened_by?: string | null;
};

const SESSION_LABEL_RE = /^(\d{4})\/(\d{4})$/;

export function isValidSessionLabel(label: string): boolean {
  const match = SESSION_LABEL_RE.exec(label.trim());
  if (!match) return false;
  const start = Number(match[1]);
  const end = Number(match[2]);
  return end === start + 1;
}

export function suggestNextSessionLabel(
  current = getCurrentAcademicSession()
): string {
  const match = SESSION_LABEL_RE.exec(current);
  if (!match) return getCurrentAcademicSession();
  const start = Number(match[1]) + 1;
  return `${start}/${start + 1}`;
}

function parseStoredValue(raw: unknown): StoredSessionValue | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as StoredSessionValue;
}

/**
 * Active session for registration, payments, dashboard, and resumption.
 * Prefers app_settings; falls back to calendar + fee map / PAYMENT_CONFIG.
 */
export async function getActiveSessionConfig(
  supabase: SupabaseLike = supabaseAdmin
): Promise<ActiveSessionConfig> {
  const calendarLabel = getCurrentAcademicSession();

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ACTIVE_SESSION_SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.warn("Active session settings lookup failed:", error.message);
    } else {
      const stored = parseStoredValue(data?.value);
      const label =
        typeof stored?.label === "string" && isValidSessionLabel(stored.label)
          ? stored.label.trim()
          : null;

      if (label) {
        const feeRaw = Number(stored?.fee_amount);
        const feeAmount =
          Number.isFinite(feeRaw) && feeRaw > 0
            ? feeRaw
            : getFeeForSession(label);

        return {
          label,
          feeAmount,
          openedAt:
            typeof stored?.opened_at === "string" ? stored.opened_at : null,
          openedBy:
            typeof stored?.opened_by === "string" ? stored.opened_by : null,
          source: "settings",
        };
      }
    }
  } catch (error) {
    console.warn("Active session settings unavailable:", error);
  }

  return {
    label: calendarLabel,
    feeAmount: getFeeForSession(calendarLabel) || PAYMENT_CONFIG.amount,
    openedAt: null,
    openedBy: null,
    source: "calendar",
  };
}

export async function saveActiveSessionConfig(
  supabase: SupabaseLike,
  params: {
    label: string;
    feeAmount: number;
    openedBy: string;
  }
): Promise<ActiveSessionConfig> {
  const label = params.label.trim();
  if (!isValidSessionLabel(label)) {
    throw new Error('Session label must look like "2027/2028"');
  }
  if (!Number.isFinite(params.feeAmount) || params.feeAmount <= 0) {
    throw new Error("Fee amount must be a positive number");
  }

  const openedAt = new Date().toISOString();
  const value = {
    label,
    fee_amount: Math.round(params.feeAmount),
    opened_at: openedAt,
    opened_by: params.openedBy,
  };

  const { error } = await supabase.from("app_settings").upsert({
    key: ACTIVE_SESSION_SETTING_KEY,
    value,
    updated_by: params.openedBy,
    updated_at: openedAt,
  });

  if (error) {
    throw new Error(error.message || "Failed to save active session");
  }

  return {
    label,
    feeAmount: value.fee_amount,
    openedAt,
    openedBy: params.openedBy,
    source: "settings",
  };
}

/** Full bed list used when resetting occupancy for a new session. */
export function fullBedsForRoomType(bedType: string | null | undefined): string[] {
  if (bedType === "6_bed") {
    return [
      "Bed 1 (Top)",
      "Bed 1 (Down)",
      "Bed 2 (Top)",
      "Bed 2 (Down)",
      "Bed 3 (Top)",
      "Bed 3 (Down)",
    ];
  }
  return [
    "Bed 1 (Top)",
    "Bed 1 (Down)",
    "Bed 2 (Top)",
    "Bed 2 (Down)",
  ];
}
