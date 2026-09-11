import { createServerSupabaseClient } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAcademicSessionForDate } from "@/shared/config/academic-session";
import { getActiveSessionConfig } from "@/shared/utils/active-session";

export interface DashboardStats {
  totalStudents: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
  occupiedBeds: number;
  totalBeds: number;
  occupancyRate: number;
  unresolvedReports: number;
  itemsNeedingRepair: number;
  pendingLogs: number;
  sessionLabel: string;
}

export async function getDashboardStats(
  sessionLabel?: string
): Promise<DashboardStats> {
  const supabase = supabaseAdmin;
  const active = sessionLabel
    ? { label: sessionLabel }
    : await getActiveSessionConfig(supabase);
  const resolvedSession = active.label;

  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .or("is_active.is.null,is_active.eq.true");

  const { data: allPayments } = await supabase
    .from("payments")
    .select("amount_paid, amount_to_pay, status, session_label, created_at");

  const sessionPayments = (allPayments || []).filter((payment) => {
    if (payment.session_label) {
      return payment.session_label === resolvedSession;
    }
    if (!payment.created_at) return false;
    return getAcademicSessionForDate(payment.created_at) === resolvedSession;
  });

  const totalPayments = sessionPayments.length;
  const completedPayments = sessionPayments.filter(
    (p) => p.status === "completed"
  ).length;

  let totalRevenue = 0;
  for (const payment of sessionPayments) {
    if (payment.status === "completed") {
      totalRevenue += Number(payment.amount_to_pay) || 0;
    } else if (payment.status === "partially_paid") {
      totalRevenue += Number(payment.amount_paid) || 0;
    }
  }

  const { data: rooms } = await supabase
    .from("rooms")
    .select("total_beds, available_beds");

  const totalBeds = rooms?.reduce((sum, room) => sum + room.total_beds, 0) || 0;
  const availableBeds =
    rooms?.reduce((sum, room) => sum + room.available_beds.length, 0) || 0;
  const occupiedBeds = totalBeds - availableBeds;

  const { count: unresolvedReports } = await supabase
    .from("student_reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["unresolved", "under_review"]);

  const { count: itemsNeedingRepair } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true })
    .in("condition", ["needs_repair", "spoilt", "destroyed"]);

  const { count: pendingLogs } = await supabase
    .from("staff_daily_logs")
    .select("*", { count: "exact", head: true })
    .eq("supervisor_status", "pending");

  return {
    totalStudents: totalStudents || 0,
    totalPayments,
    completedPayments,
    totalRevenue,
    occupiedBeds,
    totalBeds,
    occupancyRate:
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
    unresolvedReports: unresolvedReports || 0,
    itemsNeedingRepair: itemsNeedingRepair || 0,
    pendingLogs: pendingLogs || 0,
    sessionLabel: resolvedSession,
  };
}

export async function getCurrentUserRole() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log("getCurrentUserRole: No user found", userError);
    return null;
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError) {
    console.log("getCurrentUserRole: Admin lookup error", adminError);
    return null;
  }

  console.log("getCurrentUserRole: Found admin user", {
    email: user.email,
    role: adminUser?.role,
  });
  return adminUser?.role || null;
}
