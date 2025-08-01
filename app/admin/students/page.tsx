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

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  faculty: string;
  department: string;
  level: string;
  block: string;
  room: string;
  bedspace_label: string;
  state_of_origin: string;
  address?: string;
  date_of_birth?: string;
  lga?: string;
  marital_status?: string;
  religion?: string;
  course?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_relationship?: string;
  created_at: string;
}

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

  // Filter students based on faculty and level
  const filteredStudents = students.filter((student) => {
    const facultyMatch = !filterFaculty || student.faculty === filterFaculty;
    const levelMatch = !filterLevel || student.level === filterLevel;
    return facultyMatch && levelMatch;
  });

  // Get unique faculties and levels for filters
  const faculties = [...new Set(students.map((s) => s.faculty))].filter(
    Boolean
  );
  const levels = [...new Set(students.map((s) => s.level))].filter(Boolean);

  const columns: Column<Student>[] = [
    {
      key: "name",
      label: "Name",
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
      label: "Matric Number",
      render: (student) => student.matric_number,
    },
    {
      key: "faculty",
      label: "Faculty",
      render: (student) => student.faculty,
    },
    {
      key: "level",
      label: "Level",
      render: (student) => student.level,
    },
    {
      key: "phone",
      label: "Phone",
      render: (student) => student.phone,
    },
    {
      key: "actions",
      label: "Actions",
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
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: "faculty",
      label: "Faculty",
      type: "select",
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
      type: "select",
      options: levels.map((level) => ({
        value: level,
        label: level,
      })),
      value: filterLevel,
      onChange: setFilterLevel,
    },
  ];

  if (isLoading) {
    return <TableLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load students</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DataTable
        data={filteredStudents}
        columns={columns}
        filters={filters}
        searchKey="name"
        searchPlaceholder="Search students..."
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
          title="Edit Student"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="first_name"
                  value={editForm.first_name}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="last_name"
                  value={editForm.last_name}
                  onChange={handleInputChange}
                  className="mt-1"
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
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={editForm.phone}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="matricNumber">Matric Number</Label>
              <Input
                id="matricNumber"
                name="matric_number"
                value={editForm.matric_number}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={editForm.address}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="stateOfOrigin">State of Origin</Label>
              <Input
                id="stateOfOrigin"
                name="state_of_origin"
                value={editForm.state_of_origin}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingStudent(null)}
                disabled={updateStudentMutation.isPending}
              >
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
    </div>
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
      { label: "State of Origin", value: student.state_of_origin },
      { label: "LGA", value: student.lga || "Not provided" },
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
      { label: "Department", value: student.department },
      { label: "Course", value: student.course || "Not provided" },
      { label: "Level", value: student.level },
    ],
  },
  {
    title: "Accommodation",
    items: [
      { label: "Block", value: student.block },
      { label: "Room", value: student.room },
      { label: "Bedspace", value: student.bedspace_label },
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
  {
    title: "Additional Information",
    items: [
      { label: "Address", value: student.address || "Not provided" },
      {
        label: "Registration Date",
        value: new Date(student.created_at).toLocaleDateString(),
      },
    ],
  },
];

export default function StudentsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage student registrations and information.
          </p>
        </div>

        <Suspense fallback={<TableLoadingSkeleton />}>
          <StudentsTable />
        </Suspense>
      </div>
    </div>
  );
}
