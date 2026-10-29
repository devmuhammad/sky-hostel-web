"use client";

import { useEffect, useMemo, useState } from "react";
import { useStudents, usePayments, useRooms } from "@/shared/hooks/useAppData";
import {
  getCurrentAcademicSession,
  getSessionDateRange,
} from "@/shared/config/academic-session";
import {
  cashReceived,
  computeHostelStats,
  paymentInSession,
  studentInSession,
  type HostelStats,
} from "@/shared/utils/hostel-stats";

interface ReportData {
  totalStudents: number;
  totalRevenue: number;
  occupancyRate: number;
  occupiedBeds: number;
  totalBeds: number;
  completedPayments: number;
  sessionLabel: string;
  studentsByFaculty: Record<string, number>;
  studentsByLevel: Record<string, number>;
  studentsByState: Record<string, number>;
  paymentsByStatus: Record<string, number>;
  registrationTrend: Array<{ date: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

type RangePreset = "this_session" | "last_30_days" | "last_12_months" | "all_time";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

function rangeForSession(sessionLabel: string) {
  const sessionRange = getSessionDateRange(sessionLabel);
  const now = new Date();
  if (!sessionRange) {
    const start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    return { from: formatDate(start), to: formatDate(now) };
  }
  const to =
    sessionRange.end.getTime() < now.getTime() ? sessionRange.end : now;
  return { from: formatDate(sessionRange.start), to: formatDate(to) };
}

export function useReportsAnalytics() {
  const [sessionLabel, setSessionLabel] = useState(getCurrentAcademicSession);
  const [headline, setHeadline] = useState<HostelStats | null>(null);
  const [dateRange, setDateRange] = useState(() =>
    rangeForSession(getCurrentAcademicSession())
  );

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sessionRes, statsRes] = await Promise.all([
          fetch("/api/settings/session"),
          fetch("/api/admin/stats"),
        ]);
        const sessionJson = await sessionRes.json();
        const statsJson = await statsRes.json();
        if (cancelled) return;

        const label = sessionJson?.data?.label;
        if (sessionRes.ok && sessionJson.success && label) {
          setSessionLabel(label);
          setDateRange((current) => {
            const sessionDates = rangeForSession(label);
            // Keep a custom range if the user already moved it.
            const defaultDates = rangeForSession(getCurrentAcademicSession());
            if (
              current.from === defaultDates.from &&
              current.to === defaultDates.to
            ) {
              return sessionDates;
            }
            return current;
          });
        }

        if (statsRes.ok && statsJson.success && statsJson.data) {
          setHeadline(statsJson.data);
        }
      } catch {
        // Client-side computeHostelStats is the fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = studentsLoading || paymentsLoading || roomsLoading;
  const isError = Boolean(studentsError || paymentsError || roomsError);

  const reportData = useMemo<ReportData | null>(() => {
    if (!studentsData || !paymentsData || !roomsData) return null;

    const sessionStudents = (studentsData as any[]).filter((student) =>
      studentInSession(student, sessionLabel)
    );
    const sessionPayments = (paymentsData as any[]).filter((payment) =>
      paymentInSession(payment, sessionLabel)
    );

    const fallback = computeHostelStats({
      students: studentsData as any[],
      payments: paymentsData as any[],
      rooms: roomsData as any[],
      sessionLabel,
    });
    const stats = headline || fallback;

    const fromDate = new Date(`${dateRange.from}T00:00:00`);
    const toDate = new Date(`${dateRange.to}T23:59:59`);
    const inDateRange = (value?: string) => {
      if (!value) return false;
      const createdAt = new Date(value);
      return createdAt >= fromDate && createdAt <= toDate;
    };

    const chartStudents = sessionStudents.filter((student) =>
      inDateRange(student.created_at)
    );
    const chartPayments = sessionPayments.filter((payment) =>
      inDateRange(payment.created_at)
    );

    const studentsByFaculty = chartStudents.reduce(
      (acc, student) => {
        acc[student.faculty] = (acc[student.faculty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const studentsByLevel = chartStudents.reduce(
      (acc, student) => {
        acc[student.level] = (acc[student.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const studentsByState = chartStudents.reduce(
      (acc, student) => {
        acc[student.state_of_origin] =
          (acc[student.state_of_origin] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const paymentsByStatus = chartPayments.reduce(
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
      count: sessionStudents.filter((student) =>
        student.created_at?.startsWith(date)
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
      revenue: sessionPayments
        .filter((payment) => payment.created_at?.startsWith(month))
        .reduce((sum, payment) => sum + cashReceived(payment), 0),
    }));

    return {
      totalStudents: stats.totalStudents,
      totalRevenue: stats.totalRevenue,
      occupancyRate: stats.occupancyRate,
      occupiedBeds: stats.occupiedBeds,
      totalBeds: stats.totalBeds,
      completedPayments: stats.completedPayments,
      sessionLabel: stats.sessionLabel || sessionLabel,
      studentsByFaculty,
      studentsByLevel,
      studentsByState,
      paymentsByStatus,
      registrationTrend,
      revenueByMonth,
    };
  }, [
    studentsData,
    paymentsData,
    roomsData,
    dateRange,
    sessionLabel,
    headline,
  ]);

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

  const setPresetRange = (preset: RangePreset) => {
    const now = new Date();
    if (preset === "this_session") {
      setDateRange(rangeForSession(sessionLabel));
      return;
    }
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
    const timestamps = [
      ...((studentsData as any[]) || []).map((student) => student.created_at),
      ...((paymentsData as any[]) || []).map((payment) => payment.created_at),
    ]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));
    if (!timestamps.length) {
      setDateRange(rangeForSession(sessionLabel));
      return;
    }
    setDateRange({
      from: formatDate(new Date(Math.min(...timestamps))),
      to: formatDate(new Date(Math.max(...timestamps))),
    });
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
