"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type RangePreset = "last_30_days" | "last_12_months" | "all_time";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const getDefaultRange = () => {
  const now = new Date();
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  return {
    from: formatDate(oneYearAgo),
    to: formatDate(now),
  };
};

export function useReportsAnalytics() {
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const hasAutoAdjustedRange = useRef(false);

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
  const isError = Boolean(studentsError || paymentsError || roomsError);

  const availableRange = useMemo(() => {
    const timestamps = [
      ...((studentsData as any[]) || []).map((student) => student.created_at),
      ...((paymentsData as any[]) || []).map((payment) => payment.created_at),
    ]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));

    if (!timestamps.length) {
      const defaultRange = getDefaultRange();
      return defaultRange;
    }

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    return {
      from: formatDate(new Date(minTime)),
      to: formatDate(new Date(maxTime)),
    };
  }, [studentsData, paymentsData]);

  const reportData = useMemo<ReportData | null>(() => {
    if (!studentsData || !paymentsData || !roomsData) return null;

    const fromDate = new Date(`${dateRange.from}T00:00:00`);
    const toDate = new Date(`${dateRange.to}T23:59:59`);

    const filteredStudents = (studentsData as any[]).filter(
      (student: any) => {
        const createdAt = new Date(student.created_at);
        return createdAt >= fromDate && createdAt <= toDate;
      }
    );

    const filteredPayments = (paymentsData as any[]).filter(
      (payment: any) => {
        const createdAt = new Date(payment.created_at);
        return createdAt >= fromDate && createdAt <= toDate;
      }
    );

    const totalStudents = filteredStudents.length;
    const totalRevenue = filteredPayments.reduce((sum: number, p: any) => {
      if (p.status === "completed") {
        return sum + (p.amount_to_pay || 0);
      } else if (p.status === "partially_paid") {
        return sum + (p.amount_paid || 0);
      }
      return sum;
    }, 0);

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

    const studentsByFaculty = filteredStudents.reduce(
      (acc, student) => {
        acc[student.faculty] = (acc[student.faculty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const studentsByLevel = filteredStudents.reduce(
      (acc, student) => {
        acc[student.level] = (acc[student.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const studentsByState = filteredStudents.reduce(
      (acc, student) => {
        acc[student.state_of_origin] = (acc[student.state_of_origin] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const paymentsByStatus = filteredPayments.reduce(
      (acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

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

    const getMonthsOfYear = () => {
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(new Date().getFullYear(), i, 1);
        months.push(date.toISOString().slice(0, 7));
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
        .reduce((sum, payment) => sum + (payment.amount_paid || 0), 0),
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

  const hasDataInRange = useMemo(() => {
    if (!reportData) return false;
    return (
      reportData.totalStudents > 0 ||
      reportData.totalRevenue > 0 ||
      Object.keys(reportData.studentsByFaculty).length > 0 ||
      Object.keys(reportData.studentsByLevel).length > 0 ||
      (Object.values(reportData.paymentsByStatus) as number[]).reduce(
        (sum: number, count: number) => sum + count,
        0
      ) > 0
    );
  }, [reportData]);

  useEffect(() => {
    if (hasAutoAdjustedRange.current) return;
    if (!reportData) return;

    const hasAnyDataLoaded =
      (((studentsData as any[]) || []).length > 0 ||
        ((paymentsData as any[]) || []).length > 0);

    if (hasAnyDataLoaded && !hasDataInRange) {
      hasAutoAdjustedRange.current = true;
      setDateRange(availableRange);
    }
  }, [reportData, hasDataInRange, availableRange, studentsData, paymentsData]);

  const setPresetRange = (preset: RangePreset) => {
    const now = new Date();
    if (preset === "last_30_days") {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      setDateRange({ from: formatDate(start), to: formatDate(now) });
      return;
    }

    if (preset === "last_12_months") {
      const start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      setDateRange({ from: formatDate(start), to: formatDate(now) });
      return;
    }

    setDateRange(availableRange);
  };

  return {
    dateRange,
    setDateRange,
    reportData,
    isLoading,
    isError,
    hasDataInRange,
    setPresetRange,
    studentsData: (studentsData as any[]) || [],
    paymentsData: (paymentsData as any[]) || [],
  };
}
