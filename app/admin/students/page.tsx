"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { useStudentsManagement } from "./hooks/useStudentsManagement";
import { StudentsTable } from "./components/StudentsTable";
import { StudentDetailModal } from "./components/StudentDetailModal";
import { EditStudentModal } from "./components/EditStudentModal";

function StudentsManagement() {
  const {
    selectedStudent,
    setSelectedStudent,
    editingStudent,
    setEditingStudent,
    editForm,
    filterFaculty,
    setFilterFaculty,
    filterLevel,
    setFilterLevel,
    isResendingEmail,
    updateStudentMutation,
    handleEditStudent,
    handleSaveEdit,
    handleInputChange,
    handleResendEmail,
  } = useStudentsManagement();

  return (
    <>
      <StudentsTable
        filterFaculty={filterFaculty}
        filterLevel={filterLevel}
        isResendingEmail={isResendingEmail}
        onViewStudent={setSelectedStudent}
        onEditStudent={handleEditStudent}
        onResendEmail={handleResendEmail}
      />

      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <EditStudentModal
        student={editingStudent}
        editForm={editForm}
        onInputChange={handleInputChange}
        onSave={handleSaveEdit}
        onClose={() => setEditingStudent(null)}
        isPending={updateStudentMutation.isPending}
      />
    </>
  );
}

export default function StudentsPage() {
  return (
    <div className="p-4 lg:p-6 pb-8 lg:pb-12">
      <div className="mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Students
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
            Manage and view all registered students in the hostel.
          </p>
        </div>

        <Suspense fallback={<TableLoadingSkeleton rows={8} columns={6} />}>
          <StudentsManagement />
        </Suspense>
      </div>
    </div>
  );
}
