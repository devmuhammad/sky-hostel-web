"use client";

import { useState, useMemo } from "react";
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

export function useReportsAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

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

  const reportData = useMemo(() => {
    if (!studentsData || !paymentsData || !roomsData) return null;

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

  return {
    dateRange,
    setDateRange,
    reportData,
    isLoading,
    isError,
  };
}
