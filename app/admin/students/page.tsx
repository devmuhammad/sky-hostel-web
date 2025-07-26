"use client";

import { Suspense, useState, useEffect } from "react";
import Header from "@/features/dashboard/components/Header";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { DataTable, Column, Filter } from "@/shared/components/ui/data-table";
import { Modal } from "@/shared/components/ui/modal";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/useToast";

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
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [saving, setSaving] = useState(false);
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const supabase = createClientSupabaseClient();
  const toast = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

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

    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          email: editForm.email,
          phone: editForm.phone,
          matric_number: editForm.matric_number,
          address: editForm.address,
          state_of_origin: editForm.state_of_origin,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingStudent.id);

      if (error) throw error;

      toast.success("Student information updated successfully");
      setEditingStudent(null);
      await fetchStudents(); // Refresh the data
    } catch (error: any) {
      console.error("Error updating student:", error);
      toast.error(
        error.message?.includes("unique")
          ? "Matric number already exists"
          : "Failed to update student information"
      );
    } finally {
      setSaving(false);
    }
  };

  // Define table columns
  const columns: Column<Student>[] = [
    {
      key: "student",
      header: "Student",
      render: (student) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {student.first_name.charAt(0)}
              {student.last_name.charAt(0)}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {student.first_name} {student.last_name}
            </div>
            <div className="text-sm text-gray-500">{student.email}</div>
            <div className="text-sm text-gray-500">{student.matric_number}</div>
          </div>
        </div>
      ),
    },
    {
      key: "academic",
      header: "Academic Info",
      render: (student) => (
        <div>
          <div className="text-sm text-gray-900">{student.faculty}</div>
          <div className="text-sm text-gray-500">{student.department}</div>
          <div className="text-sm text-gray-500">Level {student.level}</div>
        </div>
      ),
    },
    {
      key: "accommodation",
      header: "Accommodation",
      render: (student) => (
        <div>
          <div className="text-sm text-gray-900">
            {student.block} - {student.room}
          </div>
          <div className="text-sm text-gray-500">{student.bedspace_label}</div>
        </div>
      ),
    },
    {
      key: "registration_date",
      header: "Registration Date",
      render: (student) => (
        <div className="text-sm text-gray-500">
          {new Date(student.created_at).toLocaleDateString()}
        </div>
      ),
    },
  ];

  // Define filters
  const faculties = [...new Set(students.map((s) => s.faculty))];
  const levels = [...new Set(students.map((s) => s.level))];

  const filters: Filter[] = [
    {
      key: "faculty",
      label: "Filter by Faculty",
      options: faculties.map((faculty) => ({ value: faculty, label: faculty })),
      value: filterFaculty,
      onChange: setFilterFaculty,
    },
    {
      key: "level",
      label: "Filter by Level",
      options: levels.map((level) => ({ value: level, label: level })),
      value: filterLevel,
      onChange: setFilterLevel,
    },
  ];

  // Modal content for student details
  const getStudentDetailSections = (student: Student) => [
    {
      title: "Personal Information",
      items: [
        { label: "Name", value: `${student.first_name} ${student.last_name}` },
        { label: "Email", value: student.email },
        { label: "Phone", value: student.phone },
        { label: "State of Origin", value: student.state_of_origin },
        ...(student.address
          ? [{ label: "Address", value: student.address }]
          : []),
      ],
    },
    {
      title: "Academic Information",
      items: [
        { label: "Matric Number", value: student.matric_number },
        { label: "Faculty", value: student.faculty },
        { label: "Department", value: student.department },
        { label: "Level", value: student.level },
        ...(student.course ? [{ label: "Course", value: student.course }] : []),
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
      title: "Registration",
      items: [
        {
          label: "Registration Date",
          value: new Date(student.created_at).toLocaleDateString(),
        },
      ],
    },
  ];

  return (
    <>
      <DataTable
        data={students}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name, email, or matric number..."
        searchFields={["first_name", "last_name", "email", "matric_number"]}
        filters={filters}
        onRowAction={setSelectedStudent}
        actionLabel="View Details"
        title="Students"
        emptyState={{
          title: "No students found",
          description:
            "No students have registered yet or try adjusting your search criteria.",
        }}
      />

      {/* Student Details Modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Details"
        description="Complete student information and registration details"
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedStudent) {
                  handleEditStudent(selectedStudent);
                  setSelectedStudent(null);
                }
              }}
            >
              Edit Student
            </Button>
          </div>
        }
      >
        {selectedStudent && (
          <DetailGrid
            sections={getStudentDetailSections(selectedStudent)}
            columns={2}
          />
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => !saving && setEditingStudent(null)}
        title="Edit Student Information"
        description="Update student's personal and contact information"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setEditingStudent(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        {editingStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, first_name: e.target.value })
                  }
                  disabled={saving}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, last_name: e.target.value })
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="matric_number">Matric Number</Label>
              <Input
                id="matric_number"
                value={editForm.matric_number}
                onChange={(e) =>
                  setEditForm({ ...editForm, matric_number: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                disabled={saving}
                placeholder="Enter full address"
              />
            </div>

            <div>
              <Label htmlFor="state_of_origin">State of Origin</Label>
              <Input
                id="state_of_origin"
                value={editForm.state_of_origin}
                onChange={(e) =>
                  setEditForm({ ...editForm, state_of_origin: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function StudentsPage() {
  return (
    <>
      <Header
        title="Students Management"
        subtitle="View and manage registered students"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<TableLoadingSkeleton />}>
            <StudentsTable />
          </Suspense>
        </div>
      </div>
    </>
  );
}
