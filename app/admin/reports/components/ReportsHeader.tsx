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
  const handleExportStudents = () => {
    exportToCSV("students", studentsData, paymentsData, dateRange);
  };

  const handleExportPayments = () => {
    exportToCSV("payments", studentsData, paymentsData, dateRange);
  };

  return (
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
        <Button onClick={handleExportStudents} variant="outline" size="sm">
          Export Students
        </Button>
        <Button onClick={handleExportPayments} variant="outline" size="sm">
          Export Payments
        </Button>
      </div>
    </div>
  );
}
