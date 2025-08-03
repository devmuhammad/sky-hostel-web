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
import { getDashboardStats, getCurrentUserRole } from "@/shared/utils/dashboard-stats";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { Database } from "@/shared/types/database";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Students */}
      <CardContainer title="Recent Students">
        {recentStudents.length > 0 ? (
          <div className="space-y-3">
            {recentStudents.map((student: Student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {student.first_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(student.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-600">
                    {student.block} {student.room}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent students"
            description="No students have registered recently."
          />
        )}
      </CardContainer>

      {/* Recent Payments */}
      <CardContainer title="Recent Payments">
        {recentPayments.length > 0 ? (
          <div className="space-y-3">
            {recentPayments.map((payment: Payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
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
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      Invoice: {payment.invoice_id}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₦{payment.amount_paid?.toLocaleString()}
                  </p>
                  <StatusBadge status={payment.status} />
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
    <div className="space-y-6">
      {/* Header */}
      <Header title="Dashboard" />

      {/* Stats Cards */}
      <Suspense fallback={<CardLoadingSkeleton cards={4} />}>
        <DashboardStats />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<CardLoadingSkeleton cards={2} />}>
        <RecentActivity />
      </Suspense>

      {/* Quick Actions */}
      <CardContainer title="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/students"
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Students</p>
              <p className="text-xs text-gray-500">Manage student records</p>
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Payments</p>
              <p className="text-xs text-gray-500">Track payment status</p>
            </div>
          </Link>

          <Link
            href="/admin/rooms"
            className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Rooms</p>
              <p className="text-xs text-gray-500">Manage room assignments</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
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
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Admin Users</p>
              <p className="text-xs text-gray-500">Manage system access</p>
            </div>
          </Link>
        </div>
      </CardContainer>
    </div>
  );
}
