"use client";

import { Button } from "@/shared/components/ui/button";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { CardContainer } from "@/shared/components/ui/card-container";
import { useReportsAnalytics } from "./hooks/useReportsAnalytics";
import { ReportsHeader } from "./components/ReportsHeader";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { KeyMetrics } from "./components/KeyMetrics";
import { AnalyticsCharts } from "./components/AnalyticsCharts";

export default function ReportsAnalytics() {
  const {
    dateRange,
    setDateRange,
    reportData,
    isLoading,
    isError,
    hasDataInRange,
    setPresetRange,
    studentsData,
    paymentsData,
  } = useReportsAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-5">
        <CardContainer className="border-gray-200">
          <div className="space-y-3">
            <div className="h-7 w-56 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-80 rounded bg-gray-200 animate-pulse" />
          </div>
        </CardContainer>
        <CardLoadingSkeleton cards={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardContainer className="border-gray-200">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
          </CardContainer>
          <CardContainer className="border-gray-200">
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
            </div>
          </CardContainer>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <CardContainer className="border-red-100 bg-red-50/40">
        <div className="text-center py-6">
          <p className="text-red-700 font-medium">Failed to load reports data</p>
          <p className="text-sm text-red-600 mt-1">
            There was a problem fetching analytics records.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </CardContainer>
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
        studentsData={studentsData}
        paymentsData={paymentsData}
      />

      <DateRangeFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onPresetRangeChange={setPresetRange}
      />

      <KeyMetrics
        totalStudents={reportData.totalStudents}
        totalRevenue={reportData.totalRevenue}
        occupancyRate={reportData.occupancyRate}
        completedPayments={reportData.paymentsByStatus.completed || 0}
      />

      {hasDataInRange ? (
        <AnalyticsCharts
          studentsByFaculty={reportData.studentsByFaculty}
          studentsByLevel={reportData.studentsByLevel}
          registrationTrend={reportData.registrationTrend}
        />
      ) : (
        <CardContainer className="border-dashed border-gray-300 bg-gray-50/50">
          <EmptyState
            title="No Data in This Date Range"
            description="Try a wider period to see student and payment analytics."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setPresetRange("last_30_days")}>
                  Last 30 Days
                </Button>
                <Button variant="outline" onClick={() => setPresetRange("last_12_months")}>
                  Last 12 Months
                </Button>
                <Button onClick={() => setPresetRange("all_time")}>All Time</Button>
              </div>
            }
          />
        </CardContainer>
      )}
    </div>
  );
}
