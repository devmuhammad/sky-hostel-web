"use client";

import { Button } from "@/shared/components/ui/button";
import { Column } from "@/shared/components/ui/data-table";
import { Student } from "@/shared/store/appStore";

interface TableColumnsProps {
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onResendEmail: (studentId: string) => void;
  onReportStudent: (student: Student) => void;
  isResendingEmail: string | null;
}

export function getTableColumns({
  onViewStudent,
  onEditStudent,
  onResendEmail,
  onReportStudent,
  isResendingEmail,
}: TableColumnsProps): Column<Student>[] {
  return [
    {
      key: "name",
      header: "Name",
      render: (student) => (
        <div className="min-w-0">
          <div className="font-medium text-xs sm:text-sm lg:text-base truncate">
            {student.first_name} {student.last_name}
          </div>
          <div className="text-xs text-gray-500 truncate">{student.email}</div>
        </div>
      ),
    },
    {
      key: "matric_number",
      header: "Matric Number",
      className: "hidden sm:table-cell",
      render: (student) => (
        <div className="font-mono text-xs sm:text-sm lg:text-base truncate">
          {student.matric_number}
        </div>
      ),
    },
    {
      key: "faculty",
      header: "Faculty",
      className: "hidden lg:table-cell",
      render: (student) => (
        <div className="min-w-0">
          <div className="font-medium text-xs sm:text-sm lg:text-base truncate">
            {student.faculty}
          </div>
          <div className="text-xs text-gray-500 truncate">{student.level}</div>
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (student) => (
        <div className="min-w-0">
          <div className="font-medium text-xs sm:text-sm lg:text-base truncate">
            Block {student.block}
          </div>
          <div className="text-xs text-gray-500 truncate">
            Room {student.room}
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hidden md:table-cell",
      render: (student) => (
        <div className="text-xs sm:text-sm lg:text-base truncate">
          {student.phone}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (student) => (
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewStudent(student)}
            className="text-xs px-2 py-1 h-auto"
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditStudent(student)}
            className="text-xs px-2 py-1 h-auto"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReportStudent(student)}
            className="text-xs px-2 py-1 h-auto text-red-600 border-red-200 hover:bg-red-50"
          >
            Report
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResendEmail(student.id)}
            disabled={isResendingEmail === student.id}
            className="text-xs px-2 py-1 h-auto"
          >
            {isResendingEmail === student.id ? "Sending..." : "Resend Email"}
          </Button>
        </div>
      ),
    },
  ];
}
