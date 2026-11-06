"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { useUpdateStudent } from "@/shared/hooks/useAppData";
import { Student } from "@/shared/store/appStore";
import {
  isCanonicalDepartment,
  normalizeStudentAcademics,
} from "@/shared/constants/unilorin-academics";

interface EditStudentForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  address: string;
  state_of_origin: string;
  faculty: string;
  department: string;
  [key: string]: string;
}

const EMPTY_EDIT_FORM: EditStudentForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  matric_number: "",
  address: "",
  state_of_origin: "",
  faculty: "",
  department: "",
};

export function useStudentsManagement() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditStudentForm>(EMPTY_EDIT_FORM);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);

  const updateStudentMutation = useUpdateStudent();
  const toast = useToast();

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    const academics = normalizeStudentAcademics(
      student.faculty,
      student.department,
      student.course
    );
    setEditForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      matric_number: student.matric_number,
      address: student.address || "",
      state_of_origin: student.state_of_origin,
      faculty: academics.faculty,
      department: academics.department,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;

    try {
      const academics = normalizeStudentAcademics(
        editForm.faculty,
        editForm.department
      );
      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        updates: {
          ...editForm,
          faculty: academics.faculty,
          department: academics.department,
        },
      });

      setEditingStudent(null);
      setEditForm(EMPTY_EDIT_FORM);
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAcademicChange = (name: "faculty" | "department", value: string) => {
    setEditForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "faculty" && !isCanonicalDepartment(value, prev.department)) {
        next.department = "";
      }
      return next;
    });
  };

  const handleResendEmail = async (studentId: string) => {
    setIsResendingEmail(studentId);

    try {
      const response = await fetch("/api/email/resend-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Registration email sent successfully!");
      } else {
        toast.error(result.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error("Failed to send email");
    } finally {
      setIsResendingEmail(null);
    }
  };

  const resetEditForm = () => {
    setEditForm(EMPTY_EDIT_FORM);
  };

  return {
    selectedStudent,
    setSelectedStudent,
    editingStudent,
    setEditingStudent,
    editForm,
    setEditForm,
    filterFaculty,
    setFilterFaculty,
    filterLevel,
    setFilterLevel,
    isResendingEmail,
    updateStudentMutation,
    handleEditStudent,
    handleSaveEdit,
    handleInputChange,
    handleAcademicChange,
    handleResendEmail,
    resetEditForm,
  };
}
