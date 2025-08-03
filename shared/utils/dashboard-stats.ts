import { createServerSupabaseClient } from "@/shared/config/auth";

export interface DashboardStats {
  totalStudents: number;
  totalPayments: number;
  completedPayments: number;
  totalRevenue: number;
  occupiedBeds: number;
  totalBeds: number;
  occupancyRate: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabaseClient();

  // Get total students
  const { count: totalStudents } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true });

  // Get total payments
  const { count: totalPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true });

  // Get completed payments
  const { count: completedPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  // Get total revenue
  const { data: revenueData } = await supabase
    .from("payments")
    .select("amount_paid")
    .eq("status", "completed");

  const totalRevenue =
    revenueData?.reduce((sum, payment) => sum + payment.amount_paid, 0) || 0;

  // Get occupied rooms
  const { data: rooms } = await supabase
    .from("rooms")
    .select("total_beds, available_beds");

  const totalBeds = rooms?.reduce((sum, room) => sum + room.total_beds, 0) || 0;
  const availableBeds =
    rooms?.reduce((sum, room) => sum + room.available_beds.length, 0) || 0;
  const occupiedBeds = totalBeds - availableBeds;

  return {
    totalStudents: totalStudents || 0,
    totalPayments: totalPayments || 0,
    completedPayments: completedPayments || 0,
    totalRevenue,
    occupiedBeds,
    totalBeds,
    occupancyRate:
      totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
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

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  return adminUser?.role || null;
} 