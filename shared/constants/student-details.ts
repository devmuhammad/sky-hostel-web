import { Student } from "@/shared/types/database";

export interface DetailSection {
  title: string;
  items: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
}

export const getStudentDetailSections = (student: Student): DetailSection[] => [
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