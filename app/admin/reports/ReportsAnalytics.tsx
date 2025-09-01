"use client";

import { Button } from "@/shared/components/ui/button";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useAppStore } from "@/shared/store/appStore";
import { useStudents, usePayments, useRooms } from "@/shared/hooks/useAppData";
import { useReportsAnalytics } from "./hooks/useReportsAnalytics";
import { ReportsHeader } from "./components/ReportsHeader";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { KeyMetrics } from "./components/KeyMetrics";
import { AnalyticsCharts } from "./components/AnalyticsCharts";

export default function ReportsAnalytics() {
  const { students, payments, rooms } = useAppStore();
  const { dateRange, setDateRange, reportData, isLoading, isError } =
    useReportsAnalytics();

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

  const loading =
    isLoading || studentsLoading || paymentsLoading || roomsLoading;
  const error = isError || studentsError || paymentsError || roomsError;

  if (loading) {
    return <CardLoadingSkeleton cards={4} />;
  }

  if (error) {
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
      <ReportsHeader
        dateRange={dateRange}
        studentsData={studentsData as any[]}
        paymentsData={paymentsData as any[]}
      />

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      <KeyMetrics
        totalStudents={reportData.totalStudents}
        totalRevenue={reportData.totalRevenue}
        occupancyRate={reportData.occupancyRate}
        completedPayments={reportData.paymentsByStatus.completed || 0}
      />

      <AnalyticsCharts
        studentsByFaculty={reportData.studentsByFaculty}
        studentsByLevel={reportData.studentsByLevel}
        registrationTrend={reportData.registrationTrend}
      />
    </div>
  );
}
