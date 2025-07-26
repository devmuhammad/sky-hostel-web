"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import Header from "@/features/dashboard/components/Header";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";
import {
  StatsLoadingSkeleton,
  ChartLoadingSkeleton,
} from "@/shared/components/ui/loading-skeleton";

interface ReportData {
  totalStudents: number;
  totalRevenue: number;
  occupancyRate: number;
  studentsByFaculty: Record<string, number>;
  studentsByLevel: Record<string, number>;
  studentsByState: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  registrationTrend: Array<{ date: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

function ReportsAnalytics() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Start of year
    to: new Date().toISOString().split("T")[0], // Today
  });

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      // Fetch all data in parallel
      const [studentsResult, paymentsResult, roomsResult] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to + "T23:59:59"),
        supabase
          .from("payments")
          .select("*")
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to + "T23:59:59"),
        supabase.from("rooms").select("total_beds, available_beds"),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (roomsResult.error) throw roomsResult.error;

      const students = studentsResult.data || [];
      const payments = paymentsResult.data || [];
      const rooms = roomsResult.data || [];

      // Calculate analytics
      const totalStudents = students.length;
      const totalRevenue = payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.amount_paid, 0);

      const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);
      const availableBeds = rooms.reduce(
        (sum, room) => sum + room.available_beds.length,
        0
      );
      const occupancyRate =
        totalBeds > 0
          ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100)
          : 0;

      // Group by faculty
      const studentsByFaculty = students.reduce(
        (acc, student) => {
          acc[student.faculty] = (acc[student.faculty] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Group by level
      const studentsByLevel = students.reduce(
        (acc, student) => {
          acc[student.level] = (acc[student.level] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Group by state
      const studentsByState = students.reduce(
        (acc, student) => {
          acc[student.state_of_origin] =
            (acc[student.state_of_origin] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Payment status breakdown
      const paymentsByStatus = payments.reduce(
        (acc, payment) => {
          acc[payment.status] = (acc[payment.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Registration trend (last 30 days)
      const registrationTrend = getLast30Days().map((date) => {
        const count = students.filter(
          (s) =>
            new Date(s.created_at).toDateString() ===
            new Date(date).toDateString()
        ).length;
        return { date: new Date(date).toLocaleDateString(), count };
      });

      // Revenue by month (current year)
      const revenueByMonth = getMonthsOfYear().map((month) => {
        const monthRevenue = payments
          .filter(
            (p) =>
              p.status === "completed" &&
              new Date(p.paid_at || p.created_at).getMonth() === month.index
          )
          .reduce((sum, p) => sum + p.amount_paid, 0);
        return { month: month.name, revenue: monthRevenue };
      });

      setReportData({
        totalStudents,
        totalRevenue,
        occupancyRate,
        studentsByFaculty,
        studentsByLevel,
        studentsByState,
        paymentsByStatus,
        registrationTrend,
        revenueByMonth,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split("T")[0]);
    }
    return days;
  };

  const getMonthsOfYear = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((name, index) => ({ name, index }));
  };

  const exportToCSV = async (type: "students" | "payments") => {
    try {
      const { data, error } = await supabase
        .from(type)
        .select("*")
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to + "T23:59:59");

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No data to export");
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((row) =>
        Object.values(row)
          .map((value) =>
            typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value
          )
          .join(",")
      );
      const csv = [headers, ...rows].join("\n");

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    }
  };

  if (loading || !reportData) {
    return (
      <div className="space-y-6">
        <CardContainer>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
        </CardContainer>
        <StatsLoadingSkeleton count={3} columns={3} />
        <ChartLoadingSkeleton count={4} columns={2} />
        <CardContainer>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </CardContainer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportToCSV("students")}>
              Export Students
            </Button>
            <Button variant="outline" onClick={() => exportToCSV("payments")}>
              Export Payments
            </Button>
          </div>
        </div>
      </CardContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardContainer>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
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
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.totalStudents}
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
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
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ₦{reportData.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Occupancy Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.occupancyRate}%
              </p>
            </div>
          </div>
        </CardContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Faculty */}
        <CardContainer title="Students by Faculty">
          <div className="space-y-3">
            {Object.entries(reportData.studentsByFaculty)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([faculty, count]) => (
                <div
                  key={faculty}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                    {faculty}
                  </span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / reportData.totalStudents) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContainer>

        {/* Students by Level */}
        <CardContainer title="Students by Level">
          <div className="space-y-3">
            {Object.entries(reportData.studentsByLevel)
              .sort(([, a], [, b]) => b - a)
              .map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{level}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(count / reportData.totalStudents) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContainer>

        {/* Payment Status */}
        <CardContainer title="Payment Status">
          <div className="space-y-3">
            {Object.entries(reportData.paymentsByStatus).map(
              ([status, count]) => {
                const colors = {
                  completed: "bg-green-600",
                  pending: "bg-yellow-600",
                  failed: "bg-red-600",
                };
                const total = Object.values(reportData.paymentsByStatus).reduce(
                  (sum, c) => sum + c,
                  0
                );

                return (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600 capitalize">
                      {status}
                    </span>
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${colors[status as keyof typeof colors] || "bg-gray-600"}`}
                          style={{
                            width: `${total > 0 ? (count / total) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContainer>

        {/* Top States */}
        <CardContainer title="Top States">
          <div className="space-y-3">
            {Object.entries(reportData.studentsByState)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([state, count]) => (
                <div key={state} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                    {state}
                  </span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${(count / reportData.totalStudents) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContainer>
      </div>

      {/* Registration Trend */}
      <CardContainer title="Registration Trend (Last 30 Days)">
        <div className="h-64 flex items-end justify-between space-x-1">
          {reportData.registrationTrend.map((day, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="bg-blue-600 rounded-t w-full min-h-[4px]"
                style={{
                  height: `${Math.max(4, (day.count / Math.max(...reportData.registrationTrend.map((d) => d.count))) * 200)}px`,
                }}
                title={`${day.date}: ${day.count} registrations`}
              ></div>
              <span className="text-xs text-gray-500 mt-1 rotate-45 origin-bottom-left">
                {day.date.split("/").slice(0, 2).join("/")}
              </span>
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <>
      <Header
        title="Reports & Analytics"
        subtitle="Track performance and generate insights"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="space-y-6">
                <CardContainer>
                  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                </CardContainer>
                <StatsLoadingSkeleton count={3} columns={3} />
                <ChartLoadingSkeleton count={4} columns={2} />
                <CardContainer>
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                </CardContainer>
              </div>
            }
          >
            <ReportsAnalytics />
          </Suspense>
        </div>
      </div>
    </>
  );
}
