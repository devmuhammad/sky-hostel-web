"use client";

import { Button } from "@/shared/components/ui/button";
import { DataTable } from "@/shared/components/ui/data-table";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { useAppStore } from "@/shared/store/appStore";
import { useStudents } from "@/shared/hooks/useAppData";
import { Student } from "@/shared/store/appStore";
import { getTableColumns } from "../utils/tableColumns";
import { getStudentFilters, filterStudents } from "../utils/studentFilters";

interface StudentsTableProps {
  filterFaculty: string;
  filterLevel: string;
  isResendingEmail: string | null;
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onResendEmail: (studentId: string) => void;
  onReportStudent: (student: Student) => void;
}

export function StudentsTable({
  filterFaculty,
  filterLevel,
  isResendingEmail,
  onViewStudent,
  onEditStudent,
  onResendEmail,
  onReportStudent,
}: StudentsTableProps) {
  const { students, loading } = useAppStore();
  const { data, isLoading, error } = useStudents();

  const filteredStudents = filterStudents(students, filterFaculty, filterLevel);
  const columns = getTableColumns({
    onViewStudent,
    onEditStudent,
    onResendEmail,
    onReportStudent,
    isResendingEmail,
  });
  const filters = getStudentFilters(
    students,
    filterFaculty,
    () => {},
    filterLevel,
    () => {}
  );

  if (isLoading || loading.students) {
    return <TableLoadingSkeleton rows={8} columns={6} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Failed to load students</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <DataTable
      data={filteredStudents}
      columns={columns}
      filters={filters}
      searchFields={["first_name", "last_name", "email", "matric_number"]}
    />
  );
}
