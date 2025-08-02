"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { DataTable, Column, Filter } from "@/shared/components/ui/data-table";
import { Modal } from "@/shared/components/ui/modal";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/useToast";
import { useAppStore } from "@/shared/store/appStore";
import { useStudents, useUpdateStudent } from "@/shared/hooks/useAppData";
import { Student } from "@/shared/store/appStore";

interface EditStudentForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  address: string;
  state_of_origin: string;
}

function StudentsTable() {
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

  // Use store and hooks instead of local state
  const { students, loading } = useAppStore();
  const { data, isLoading, error } = useStudents();
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

  // Filter students based on faculty and level
  const filteredStudents = students.filter((student) => {
    const facultyMatch = !filterFaculty || student.faculty === filterFaculty;
    const levelMatch = !filterLevel || student.level === filterLevel;
    return facultyMatch && levelMatch;
  });

  // Get unique faculties and levels for filters
  const faculties = [...new Set(students.map((s) => s.faculty))].filter(
    (faculty): faculty is string => Boolean(faculty)
  );
  const levels = [...new Set(students.map((s) => s.level))].filter(
    (level): level is string => Boolean(level)
  );

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Name",
      render: (student) => (
        <div>
          <div className="font-medium">
            {student.first_name} {student.last_name}
          </div>
          <div className="text-sm text-gray-500">{student.email}</div>
        </div>
      ),
    },
    {
      key: "matric_number",
      header: "Matric Number",
      render: (student) => (
        <div className="font-mono text-sm">{student.matric_number}</div>
      ),
    },
    {
      key: "faculty",
      header: "Faculty",
      render: (student) => (
        <div>
          <div className="font-medium">{student.faculty}</div>
          <div className="text-sm text-gray-500">{student.level}</div>
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (student) => (
        <div>
          <div className="font-medium">Block {student.block}</div>
          <div className="text-sm text-gray-500">Room {student.room}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (student) => <div className="text-sm">{student.phone}</div>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (student) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedStudent(student)}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEditStudent(student)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResendEmail(student.id)}
            disabled={isResendingEmail === student.id}
          >
            {isResendingEmail === student.id ? "Sending..." : "Resend Email"}
          </Button>
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: "faculty",
      label: "Faculty",
      options: faculties.map((faculty) => ({
        value: faculty,
        label: faculty,
      })),
      value: filterFaculty,
      onChange: setFilterFaculty,
    },
    {
      key: "level",
      label: "Level",
      options: levels.map((level) => ({
        value: level,
        label: level,
      })),
      value: filterLevel,
      onChange: setFilterLevel,
    },
  ];

  // Show loading skeleton if data is loading
  if (isLoading || loading.students) {
    return <TableLoadingSkeleton rows={8} columns={6} />;
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">Failed to load students</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <DataTable
        data={filteredStudents}
        columns={columns}
        filters={filters}
        searchFields={["first_name", "last_name", "email", "matric_number"]}
      />

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student Details - ${selectedStudent.first_name} ${selectedStudent.last_name}`}
        >
          <DetailGrid sections={getStudentDetailSections(selectedStudent)} />
        </Modal>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <Modal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          title={`Edit Student - ${editingStudent.first_name} ${editingStudent.last_name}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editForm.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={editForm.phone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="matric_number">Matric Number</Label>
              <Input
                id="matric_number"
                name="matric_number"
                value={editForm.matric_number}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={editForm.address}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="state_of_origin">State of Origin</Label>
              <Input
                id="state_of_origin"
                name="state_of_origin"
                value={editForm.state_of_origin}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateStudentMutation.isPending}
              >
                {updateStudentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

const getStudentDetailSections = (student: Student) => [
  {
    title: "Personal Information",
    items: [
      {
        label: "Full Name",
        value: `${student.first_name} ${student.last_name}`,
      },
      { label: "Email", value: student.email },
      { label: "Phone", value: student.phone },
      { label: "Matric Number", value: student.matric_number },
      {
        label: "Date of Birth",
        value: student.date_of_birth || "Not provided",
      },
      {
        label: "Marital Status",
        value: student.marital_status || "Not provided",
      },
      { label: "Religion", value: student.religion || "Not provided" },
    ],
  },
  {
    title: "Academic Information",
    items: [
      { label: "Faculty", value: student.faculty },
      { label: "Level", value: student.level },
      { label: "Course", value: student.course || "Not provided" },
    ],
  },
  {
    title: "Address Information",
    items: [
      { label: "Address", value: student.address || "Not provided" },
      { label: "State of Origin", value: student.state_of_origin },
      { label: "LGA", value: student.lga || "Not provided" },
    ],
  },
  {
    title: "Hostel Information",
    items: [
      { label: "Block", value: student.block },
      { label: "Room", value: student.room },
      {
        label: "Registration Date",
        value: new Date(student.created_at).toLocaleDateString(),
      },
    ],
  },
  {
    title: "Next of Kin",
    items: [
      { label: "Name", value: student.next_of_kin_name || "Not provided" },
      { label: "Phone", value: student.next_of_kin_phone || "Not provided" },
      { label: "Email", value: student.next_of_kin_email || "Not provided" },
      {
        label: "Relationship",
        value: student.next_of_kin_relationship || "Not provided",
      },
    ],
  },
];

export default function StudentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-2">
          Manage and view all registered students in the hostel.
        </p>
      </div>

      <Suspense fallback={<TableLoadingSkeleton rows={8} columns={6} />}>
        <StudentsTable />
      </Suspense>
    </div>
  );
}
