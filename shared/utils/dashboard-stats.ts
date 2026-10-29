import { createServerSupabaseClient } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getActiveSessionConfig } from "@/shared/utils/active-session";
import { computeHostelStats, type HostelStats } from "@/shared/utils/hostel-stats";
import { fetchAllRows } from "@/shared/utils/supabase-fetch";

export interface DashboardStats extends HostelStats {
  unresolvedReports: number;
  itemsNeedingRepair: number;
  pendingLogs: number;
}

export async function getDashboardStats(
  sessionLabel?: string
): Promise<DashboardStats> {
  const active = sessionLabel
    ? { label: sessionLabel }
    : await getActiveSessionConfig(supabaseAdmin);
  const resolvedSession = active.label;

  const [students, payments, rooms] = await Promise.all([
    fetchAllRows(supabaseAdmin, "students", [
      "id",
      "is_active",
      "account_status",
      "enrollment_session",
      "created_at",
      "bedspace_label",
      "block",
      "room",
    ].join(", ")),
    fetchAllRows(supabaseAdmin, "payments", [
      "amount_paid",
      "status",
      "session_label",
      "created_at",
      "payment_source",
    ].join(", ")),
    fetchAllRows(supabaseAdmin, "rooms", "id, total_beds", "id"),
  ]);

  const hostel = computeHostelStats({
    students,
    payments,
    rooms,
    sessionLabel: resolvedSession,
  });

  const { count: unresolvedReports } = await supabaseAdmin
    .from("student_reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["unresolved", "under_review"]);

  const { count: itemsNeedingRepair } = await supabaseAdmin
    .from("inventory_items")
    .select("*", { count: "exact", head: true })
    .in("condition", ["needs_repair", "spoilt", "destroyed"]);

  const { count: pendingLogs } = await supabaseAdmin
    .from("staff_daily_logs")
    .select("*", { count: "exact", head: true })
    .eq("supervisor_status", "pending");

  return {
    ...hostel,
    unresolvedReports: unresolvedReports || 0,
    itemsNeedingRepair: itemsNeedingRepair || 0,
    pendingLogs: pendingLogs || 0,
  };
}

export async function getCurrentUserRole() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError) {
    return null;
  }

  return adminUser?.role || null;
}
