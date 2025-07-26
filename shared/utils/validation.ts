import { z } from "zod";
import { ValidationPatterns } from "./validation-patterns";

// Re-export validation patterns for convenience
export { ValidationPatterns };

// Registration form schema
export const RegistrationSchema = z.object({
  // Personal Information
  firstName: ValidationPatterns.personalInfo.firstName,
  lastName: ValidationPatterns.personalInfo.lastName,
  email: ValidationPatterns.personalInfo.email,
  phoneNumber: ValidationPatterns.personalInfo.phone,
  dateOfBirth: ValidationPatterns.dateOfBirth,
  address: z.string().min(1, "Address is required"),
  stateOfOrigin: z.string().min(1, "State of origin is required"),
  lga: z.string().min(1, "Local Government Area is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  religion: z.string().min(1, "Religion is required"),

  // Academic Information
  matricNumber: ValidationPatterns.academic.matricNumber,
  course: ValidationPatterns.academic.course,
  level: ValidationPatterns.academic.level,
  faculty: ValidationPatterns.academic.faculty,
  department: ValidationPatterns.academic.department,

  // Next of Kin Information
  nextOfKinName: ValidationPatterns.nextOfKin.nextOfKinName,
  nextOfKinPhoneNumber: ValidationPatterns.nextOfKin.nextOfKinPhoneNumber,
  nextOfKinEmail: ValidationPatterns.nextOfKin.nextOfKinEmail,
  nextOfKinRelationship: ValidationPatterns.nextOfKin.nextOfKinRelationship,
});

// Payment form schema
export const PaymentSchema = z.object({
  firstName: ValidationPatterns.personalInfo.firstName,
  lastName: ValidationPatterns.personalInfo.lastName,
  email: ValidationPatterns.personalInfo.email,
  phone: ValidationPatterns.personalInfo.phone,
  // amount removed - configured in PAYMENT_CONFIG
});

export type RegistrationFormData = z.infer<typeof RegistrationSchema>;
export type PaymentFormData = z.infer<typeof PaymentSchema>;

// Helper functions for DynamicForm
export const getFieldLabel = (fieldName: string): string => {
  const labelMap: Record<string, string> = {
    email: "Email Address",
    dateOfBirth: "Date of Birth",
    phoneNumber: "Phone Number",
    phone: "Phone Number",
    firstName: "First Name",
    lastName: "Last Name",
    stateOfOrigin: "State of Origin",
    maritalStatus: "Marital Status",
    matricNumber: "Matric Number",
    nextOfKinName: "Next of Kin Name",
    nextOfKinPhoneNumber: "Next of Kin Phone Number",
    nextOfKinEmail: "Next of Kin Email",
    nextOfKinRelationship: "Next of Kin Relationship",

    address: "Address",
    lga: "Local Government Area",
    religion: "Religion",
    course: "Course",
    level: "Level",
    faculty: "Faculty",
    department: "Department",
  };

  return (
    labelMap[fieldName] ||
    String(fieldName).charAt(0).toUpperCase() + String(fieldName).slice(1)
  );
};

export const getInputType = (fieldName: string): string => {
  if (fieldName === "password") return "password";
  if (fieldName === "email" || fieldName === "nextOfKinEmail") return "email";
  if (fieldName === "dateOfBirth") return "date";
  if (
    fieldName === "phoneNumber" ||
    fieldName === "phone" ||
    fieldName === "nextOfKinPhoneNumber"
  )
    return "tel";

  return "text";
};

export const getInputProps = (fieldName: string, field: any) => {
  const baseProps = {
    required: true,
    className:
      "paragraph-regular bg-gray-600 no-focus min-h-12 rounded-1.5 border",
    ...field,
  };

  return baseProps;
};
