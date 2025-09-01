import { RegistrationFormData } from "@/shared/utils/validation";

// Field configuration types
export interface FieldConfig {
  type: "text" | "email" | "tel" | "date" | "select";
  required: boolean;
  section: "personal" | "academic" | "nextOfKin";
  canBeDisabled?: boolean;
  canBePreFilled?: boolean;
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string }>;
}

// Field configuration for dynamic rendering
export const FIELD_CONFIG: Record<keyof RegistrationFormData, FieldConfig> = {
  // Personal Information
  firstName: {
    type: "text",
    required: true,
    section: "personal",
    canBePreFilled: true,
  },
  lastName: {
    type: "text",
    required: true,
    section: "personal",
    canBePreFilled: true,
  },
  email: {
    type: "email",
    required: true,
    section: "personal",
    canBeDisabled: true,
  },
  phoneNumber: {
    type: "tel",
    required: true,
    section: "personal",
    canBeDisabled: true,
  },
  dateOfBirth: { type: "date", required: true, section: "personal" },
  address: {
    type: "text",
    required: true,
    section: "personal",
    fullWidth: true,
  },
  stateOfOrigin: { type: "text", required: true, section: "personal" },
  lga: { type: "text", required: true, section: "personal" },
  maritalStatus: {
    type: "select",
    required: true,
    section: "personal",
    options: [
      { value: "", label: "Select status" },
      { value: "Single", label: "Single" },
      { value: "Married", label: "Married" },
      { value: "Divorced", label: "Divorced" },
      { value: "Widowed", label: "Widowed" },
    ],
  },
  religion: { type: "text", required: true, section: "personal" },
  weight: {
    type: "text",
    required: true,
    section: "personal",
    fullWidth: false,
  },

  // Academic Information
  matricNumber: { type: "text", required: true, section: "academic" },
  course: { type: "text", required: true, section: "academic" },
  faculty: { type: "text", required: true, section: "academic" },
  department: { type: "text", required: true, section: "academic" },
  level: {
    type: "select",
    required: true,
    section: "academic",
    fullWidth: true,
    options: [
      { value: "", label: "Select level" },
      { value: "100", label: "100 Level" },
      { value: "200", label: "200 Level" },
      { value: "300", label: "300 Level" },
      { value: "400", label: "400 Level" },
      { value: "500", label: "500 Level" },
      { value: "600", label: "600 Level" },
      { value: "Masters", label: "Masters" },
    ],
  },

  // Next of Kin Information
  nextOfKinName: { type: "text", required: true, section: "nextOfKin" },
  nextOfKinPhoneNumber: { type: "tel", required: true, section: "nextOfKin" },
  nextOfKinEmail: { type: "email", required: true, section: "nextOfKin" },
  nextOfKinRelationship: {
    type: "select",
    required: true,
    section: "nextOfKin",
    options: [
      { value: "", label: "Select relationship" },
      { value: "Parent", label: "Parent" },
      { value: "Guardian", label: "Guardian" },
      { value: "Sibling", label: "Sibling" },
      { value: "Spouse", label: "Spouse" },
      { value: "Relative", label: "Relative" },
      { value: "Friend", label: "Friend" },
    ],
  },
};

export const SECTION_CONFIG = {
  personal: {
    title: "Personal Information",
    gridCols: "grid-cols-1 md:grid-cols-2",
  },
  academic: {
    title: "Academic Information",
    gridCols: "grid-cols-1 md:grid-cols-2",
  },
  nextOfKin: {
    title: "Next of Kin Information",
    gridCols: "grid-cols-1 md:grid-cols-2",
  },
} as const;
