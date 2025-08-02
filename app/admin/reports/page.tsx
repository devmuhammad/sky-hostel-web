"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";
import {
  CardLoadingSkeleton,
  TableLoadingSkeleton,
} from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useAppStore } from "@/shared/store/appStore";
import { useStudents, usePayments, useRooms } from "@/shared/hooks/useAppData";

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
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Start of year
    to: new Date().toISOString().split("T")[0], // Today
  });

  // Use prefetched data from store
  const { students, payments, rooms } = useAppStore();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents();
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = usePayments();
  const {
    data: roomsData,
    isLoading: roomsLoading,
    error: roomsError,
  } = useRooms();

  const isLoading = studentsLoading || paymentsLoading || roomsLoading;
  const isError = studentsError || paymentsError || roomsError;

  // Calculate report data from prefetched data
  const reportData = useMemo(() => {
    if (!studentsData || !paymentsData || !roomsData) return null;

    // Filter data by date range
    const filteredStudents = (studentsData as any[]).filter(
      (student: any) =>
        student.created_at >= dateRange.from &&
        student.created_at <= dateRange.to + "T23:59:59"
    );

    const filteredPayments = (paymentsData as any[]).filter(
      (payment: any) =>
        payment.created_at >= dateRange.from &&
        payment.created_at <= dateRange.to + "T23:59:59"
    );

    // Calculate analytics
    const totalStudents = filteredStudents.length;
    const totalRevenue = filteredPayments
      .filter((p: any) => p.status === "completed")
      .reduce((sum: number, p: any) => sum + p.amount_paid, 0);

    const totalBeds = (roomsData as any[]).reduce(
      (sum: number, room: any) => sum + room.total_beds,
      0
    );
    const availableBeds = (roomsData as any[]).reduce(
      (sum: number, room: any) => sum + room.available_beds.length,
      0
    );
    const occupancyRate =
      totalBeds > 0
        ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100)
        : 0;

    // Group by faculty
    const studentsByFaculty = filteredStudents.reduce(
      (acc, student) => {
        acc[student.faculty] = (acc[student.faculty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by level
    const studentsByLevel = filteredStudents.reduce(
      (acc, student) => {
        acc[student.level] = (acc[student.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group by state
    const studentsByState = filteredStudents.reduce(
      (acc, student) => {
        acc[student.state_of_origin] = (acc[student.state_of_origin] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Group payments by status
    const paymentsByStatus = filteredPayments.reduce(
      (acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Registration trend (last 30 days)
    const getLast30Days = () => {
      const dates = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
      return dates;
    };

    const registrationTrend = getLast30Days().map((date) => ({
      date,
      count: filteredStudents.filter((student) =>
        student.created_at.startsWith(date)
      ).length,
    }));

    // Revenue by month
    const getMonthsOfYear = () => {
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(new Date().getFullYear(), i, 1);
        months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
      }
      return months;
    };

    const revenueByMonth = getMonthsOfYear().map((month) => ({
      month,
      revenue: filteredPayments
        .filter(
          (payment) =>
            payment.status === "completed" &&
            payment.created_at.startsWith(month)
        )
        .reduce((sum, payment) => sum + payment.amount_paid, 0),
    }));

    return {
      totalStudents,
      totalRevenue,
      occupancyRate,
      studentsByFaculty,
      studentsByLevel,
      studentsByState,
      paymentsByStatus,
      registrationTrend,
      revenueByMonth,
    };
  }, [studentsData, paymentsData, roomsData, dateRange]);

  const exportToCSV = async (type: "students" | "payments") => {
    if (!studentsData || !paymentsData) return;

    let csvContent = "";
    let filename = "";

    if (type === "students") {
      filename = `students_${dateRange.from}_to_${dateRange.to}.csv`;
      csvContent =
        "Name,Email,Phone,Matric Number,Faculty,Level,State,Room,Bed\n";

      const filteredStudents = (studentsData as any[]).filter(
        (student: any) =>
          student.created_at >= dateRange.from &&
          student.created_at <= dateRange.to + "T23:59:59"
      );

      filteredStudents.forEach((student: any) => {
        csvContent += `"${student.first_name} ${student.last_name}","${student.email}","${student.phone}","${student.matric_number}","${student.faculty}","${student.level}","${student.state_of_origin}","${student.block}${student.room}","${student.bedspace_label}"\n`;
      });
    } else {
      filename = `payments_${dateRange.from}_to_${dateRange.to}.csv`;
      csvContent = "Email,Phone,Amount,Status,Invoice ID,Date\n";

      const filteredPayments = (paymentsData as any[]).filter(
        (payment: any) =>
          payment.created_at >= dateRange.from &&
          payment.created_at <= dateRange.to + "T23:59:59"
      );

      filteredPayments.forEach((payment: any) => {
        csvContent += `"${payment.email}","${payment.phone}","${payment.amount_paid}","${payment.status}","${payment.invoice_id}","${payment.created_at}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <CardLoadingSkeleton cards={4} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load reports data</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <EmptyState
        title="No Data Available"
        description="There is no data to display for the selected date range."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive insights into your hostel operations
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Button
            onClick={() => exportToCSV("students")}
            variant="outline"
            size="sm"
          >
            Export Students
          </Button>
          <Button
            onClick={() => exportToCSV("payments")}
            variant="outline"
            size="sm"
          >
            Export Payments
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <CardContainer>
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange({ ...dateRange, from: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange({ ...dateRange, to: e.target.value })
              }
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </CardContainer>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Payment Status
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.paymentsByStatus.completed || 0}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </CardContainer>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Students by Faculty */}
        <CardContainer title="Students by Faculty">
          <div className="space-y-3">
            {Object.entries(reportData.studentsByFaculty)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([faculty, count]) => (
                <div
                  key={faculty}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{faculty}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </CardContainer>

        {/* Students by Level */}
        <CardContainer title="Students by Level">
          <div className="space-y-3">
            {Object.entries(reportData.studentsByLevel)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{level}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </CardContainer>
      </div>

      {/* Registration Trend */}
      <CardContainer title="Registration Trend (Last 30 Days)">
        <div className="h-64 flex items-end space-x-1">
          {reportData.registrationTrend.map((day, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t"
              style={{
                height: `${Math.max((day.count / Math.max(...reportData.registrationTrend.map((d) => d.count))) * 200, 4)}px`,
              }}
              title={`${day.date}: ${day.count} registrations`}
            ></div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Daily student registrations
        </div>
      </CardContainer>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto space-y-4 lg:space-y-6">
        <Suspense fallback={<CardLoadingSkeleton cards={4} />}>
          <ReportsAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
