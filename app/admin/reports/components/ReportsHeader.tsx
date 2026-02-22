"use client";

import { Button } from "@/shared/components/ui/button";
import { exportToCSV } from "../utils/exportUtils";

interface ReportsHeaderProps {
  dateRange: { from: string; to: string };
  studentsData: any[];
  paymentsData: any[];
}

export function ReportsHeader({
  dateRange,
  studentsData,
  paymentsData,
}: ReportsHeaderProps) {
  const hasStudentData = studentsData.length > 0;
  const hasPaymentData = paymentsData.length > 0;

  const handleExportStudents = () => {
    exportToCSV("students", studentsData, paymentsData, dateRange);
  };

  const handleExportPayments = () => {
    exportToCSV("payments", studentsData, paymentsData, dateRange);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive insights into your hostel operations
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleExportStudents} variant="outline" size="sm" disabled={!hasStudentData}>
          Export Students
        </Button>
        <Button onClick={handleExportPayments} variant="outline" size="sm" disabled={!hasPaymentData}>
          Export Payments
        </Button>
      </div>
    </div>
  );
}
