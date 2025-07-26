import { z } from "zod";

// Reusable field patterns
export const ValidationPatterns = {
  // Basic patterns
  name: (fieldName: string) => z.string().min(1, `${fieldName} is required`),

  email: z.string().email("Please provide a valid email address"),

  phone: z.string().min(10, "Phone number must be at least 10 digits"),

  amount: (max: number = 219000) =>
    z
      .number()
      .min(1, "Amount is required")
      .max(max, `Amount cannot exceed ₦${max.toLocaleString()}`),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const parsedDate = new Date(date);
      return parsedDate <= new Date();
    }, "Date of birth must be in the past"),

  // Composite patterns
  personalInfo: {
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
  },

  nextOfKin: {
    nextOfKinName: z.string().min(1, "Next of kin name is required"),
    nextOfKinPhoneNumber: z
      .string()
      .min(10, "Next of kin phone number must be at least 10 digits"),
    nextOfKinEmail: z.string().email("Please provide a valid email address"),
    nextOfKinRelationship: z
      .string()
      .min(1, "Next of kin relationship is required"),
  },

  academic: {
    matricNumber: z.string().min(1, "Matric number is required"),
    course: z.string().min(1, "Course is required"),
    level: z.string().min(1, "Level is required"),
    faculty: z.string().min(1, "Faculty is required"),
    department: z.string().min(1, "Department is required"),
  },
};

// Schema builders using patterns
export const SchemaBuilder = {
  payment: () =>
    z.object({
      ...ValidationPatterns.personalInfo,
      amount: ValidationPatterns.amount(),
    }),

  basicInfo: () =>
    z.object({
      ...ValidationPatterns.personalInfo,
      dateOfBirth: ValidationPatterns.dateOfBirth,
      address: ValidationPatterns.name("Address"),
      stateOfOrigin: ValidationPatterns.name("State of origin"),
      lga: ValidationPatterns.name("Local government area"),
      maritalStatus: ValidationPatterns.name("Marital status"),
      religion: ValidationPatterns.name("Religion"),
    }),

  registration: () =>
    z.object({
      ...ValidationPatterns.personalInfo,
      dateOfBirth: ValidationPatterns.dateOfBirth,
      address: ValidationPatterns.name("Address"),
      stateOfOrigin: ValidationPatterns.name("State of origin"),
      lga: ValidationPatterns.name("Local government area"),
      maritalStatus: ValidationPatterns.name("Marital status"),
      religion: ValidationPatterns.name("Religion"),
      ...ValidationPatterns.academic,
      ...ValidationPatterns.nextOfKin,
    }),
};
