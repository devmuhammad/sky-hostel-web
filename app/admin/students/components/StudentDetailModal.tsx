"use client";

import { useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { Student } from "@/shared/store/appStore";
import { getStudentDetailSections } from "@/shared/constants/student-details";
import { ReportTimeline } from "@/features/student-reports/components/ReportTimeline";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailModal({
  student,
  onClose,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "behaviour">("overview");

  if (!student) return null;

  return (
    <Modal
      isOpen={!!student}
      onClose={() => {
        onClose();
        setActiveTab("overview");
      }}
      title={`Student Details - ${student.first_name} ${student.last_name}`}
      size="lg"
    >
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("behaviour")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === "behaviour"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Behaviour & Incidents
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "overview" ? (
          <DetailGrid sections={getStudentDetailSections(student)} />
        ) : (
          <ReportTimeline studentId={student.id} />
        )}
      </div>
    </Modal>
  );
}
