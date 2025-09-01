"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { useUpdateStudent } from "@/shared/hooks/useAppData";
import { Student } from "@/shared/store/appStore";

interface EditStudentForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  address: string;
  state_of_origin: string;
  [key: string]: string;
}

export function useStudentsManagement() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditStudentForm>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    matric_number: "",
    address: "",
    state_of_origin: "",
  });
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);

  const updateStudentMutation = useUpdateStudent();
  const toast = useToast();

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone,
      matric_number: student.matric_number,
      address: student.address || "",
      state_of_origin: student.state_of_origin,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;

    try {
      await updateStudentMutation.mutateAsync({
        id: editingStudent.id,
        updates: editForm,
      });

      setEditingStudent(null);
      setEditForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        matric_number: "",
        address: "",
        state_of_origin: "",
      });
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
    setEditForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      matric_number: "",
      address: "",
      state_of_origin: "",
    });
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
    handleResendEmail,
    resetEditForm,
  };
}
