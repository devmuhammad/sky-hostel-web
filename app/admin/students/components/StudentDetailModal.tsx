"use client";

import { Modal } from "@/shared/components/ui/modal";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { Student } from "@/shared/store/appStore";
import { getStudentDetailSections } from "@/shared/constants/student-details";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailModal({
  student,
  onClose,
}: StudentDetailModalProps) {
  if (!student) return null;

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title={`Student Details - ${student.first_name} ${student.last_name}`}
      size="lg"
    >
      <DetailGrid sections={getStudentDetailSections(student)} />
    </Modal>
  );
}
