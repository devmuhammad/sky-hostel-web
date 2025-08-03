import { Database } from "@/shared/types/database";

type Student = Database["public"]["Tables"]["students"]["Row"];

export interface DetailSection {
  title: string;
  items: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
}

export const getStudentDetailSections = (student: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  date_of_birth?: string;
  address?: string;
  state_of_origin: string;
  lga?: string;
  marital_status?: string;
  religion?: string;
  faculty?: string;
  level?: string;
  course?: string;
  block?: string;
  room?: string;
  bedspace_label?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_relationship?: string;
  passport_photo_url?: string | null;
  payment_id: string;
  created_at: string;
  updated_at: string;
}): DetailSection[] => [
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
      { label: "Faculty", value: student.faculty || "Not provided" },
      { label: "Level", value: student.level || "Not provided" },
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
      { label: "Block", value: student.block || "Not provided" },
      { label: "Room", value: student.room || "Not provided" },
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
