import { Suspense } from "react";
import Link from "next/link";
import Header from "@/features/dashboard/components/Header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { CardContainer } from "@/shared/components/ui/card-container";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import {
  CardLoadingSkeleton,
  TableLoadingSkeleton,
} from "@/shared/components/ui/loading-skeleton";
import { createServerSupabaseClient } from "@/shared/config/auth";

async function getCurrentUserRole() {
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

async function getDashboardStats() {
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

async function getRecentActivity() {
  const supabase = await createServerSupabaseClient();

  const { data: recentStudents } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentPayments } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    recentStudents: recentStudents || [],
    recentPayments: recentPayments || [],
  };
}

async function DashboardStats() {
  const [stats, userRole] = await Promise.all([
    getDashboardStats(),
    getCurrentUserRole(),
  ]);

  const isSuperAdmin = userRole === "super_admin";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Students"
        value={stats.totalStudents}
        change={{ value: 12, type: "increase" }}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        }
      />
      {isSuperAdmin && (
        <StatsCard
          title="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
          change={{ value: 8.2, type: "increase" }}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          }
        />
      )}
      <StatsCard
        title="Total Payments"
        value={stats.totalPayments}
        change={{ value: 5.4, type: "increase" }}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2.5 2.5 0 014 0z"
            />
          </svg>
        }
      />
      <StatsCard
        title="Occupancy Rate"
        value={`${stats.occupancyRate}%`}
        change={{ value: 2.1, type: "increase" }}
        icon={
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        }
      />
    </div>
  );
}

async function RecentActivity() {
  const { recentStudents, recentPayments } = await getRecentActivity();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Recent Students */}
      <CardContainer>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Students
          </h3>
          <Link
            href="/admin/students"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {recentStudents.length > 0 ? (
          <div className="space-y-3">
            {recentStudents.map((student, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">
                    Block {student.block}, Room {student.room}
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(student.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent students"
            description="No students have been registered recently."
          />
        )}
      </CardContainer>

      {/* Recent Payments */}
      <CardContainer>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Payments
          </h3>
          <Link
            href="/admin/payments"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        {recentPayments.length > 0 ? (
          <div className="space-y-3">
            {recentPayments.map((payment, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{payment.email}</p>
                  <p className="text-sm text-gray-500">
                    ₦{payment.amount_paid.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <StatusBadge status={payment.status} />
                  <span className="text-sm text-gray-400">
                    {new Date(payment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent payments"
            description="No payments have been made recently."
          />
        )}
      </CardContainer>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="p-4 lg:p-6 mx-auto space-y-4 lg:space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2 text-sm lg:text-base">
          Welcome to the Sky Hostel admin dashboard. Here&apos;s an overview of
          your hostel&apos;s performance.
        </p>
      </div>

      <Suspense fallback={<CardLoadingSkeleton cards={4} />}>
        <DashboardStats />
      </Suspense>

      <Suspense fallback={<TableLoadingSkeleton rows={5} columns={3} />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
