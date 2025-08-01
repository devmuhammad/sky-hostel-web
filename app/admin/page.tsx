import { Suspense } from "react";
import Link from "next/link";
import Header from "@/features/dashboard/components/Header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { CardContainer } from "@/shared/components/ui/card-container";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { StatsLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { createServerSupabaseClient } from "@/shared/config/auth";

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

  // Get recent students (last 5)
  const { data: recentStudents } = await supabase
    .from("students")
    .select("first_name, last_name, block, room, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get recent payments (last 5)
  const { data: recentPayments } = await supabase
    .from("payments")
    .select("email, amount_paid, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const formattedStudents = (recentStudents || []).map((student) => ({
    name: `${student.first_name} ${student.last_name}`,
    block: student.block,
    room: student.room,
    created_at: student.created_at,
  }));

  return {
    recentStudents: formattedStudents,
    recentPayments: recentPayments || [],
  };
}

async function DashboardStats() {
  const stats = await getDashboardStats();

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

      <StatsCard
        title="Total Revenue"
        value={`₦${stats.totalRevenue.toLocaleString()}`}
        change={{ value: 8, type: "increase" }}
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
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        }
      />

      <StatsCard
        title="Completed Payments"
        value={stats.completedPayments}
        change={{ value: 15, type: "increase" }}
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        }
      />

      <StatsCard
        title="Occupancy Rate"
        value={`${stats.occupancyRate}%`}
        change={{ value: 5, type: "increase" }}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Registrations */}
      <CardContainer title="Recent Registrations">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin/students"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {recentStudents.map((student, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {student.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {student.block} - {student.room}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(student.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
          {recentStudents.length === 0 && (
            <EmptyState
              title="No recent registrations"
              description="No students have registered recently"
            />
          )}
        </div>
      </CardContainer>

      {/* Recent Payments */}
      <CardContainer title="Recent Payments">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/admin/payments"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {recentPayments.map((payment, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    payment.status === "completed"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      payment.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ₦{payment.amount_paid.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{payment.email}</p>
                </div>
              </div>
              <StatusBadge status={payment.status} variant="payment" />
            </div>
          ))}
          {recentPayments.length === 0 && (
            <EmptyState
              title="No recent payments"
              description="No payments have been made recently"
            />
          )}
        </div>
      </CardContainer>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back! Here's what's happening with your hostel.
            </p>
          </div>

          {/* Stats Cards */}
          <Suspense fallback={<StatsLoadingSkeleton />}>
            <DashboardStats />
          </Suspense>

          {/* Recent Activity */}
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardContainer>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>
                <CardContainer>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContainer>
              </div>
            }
          >
            <RecentActivity />
          </Suspense>

          {/* Quick Actions */}
          <CardContainer title="Quick Actions">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/registration" className="group">
                <div className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    Add New Student
                  </span>
                </div>
              </Link>

              <Link href="/admin/reports" className="group">
                <div className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    Generate Report
                  </span>
                </div>
              </Link>

              <Link href="/admin/rooms" className="group">
                <div className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-500"
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
                  <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">
                    Manage Rooms
                  </span>
                </div>
              </Link>
            </div>
          </CardContainer>
        </div>
      </div>
    </>
  );
}
