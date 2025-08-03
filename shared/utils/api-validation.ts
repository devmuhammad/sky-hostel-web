import { NextResponse } from "next/server";

export interface ValidationError {
  success: false;
  error: { message: string };
}

export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): ValidationError | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return {
        success: false,
        error: { message: `${String(field)} is required` },
      };
    }
  }
  return null;
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error: { message } },
    { status }
  );
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

export const STUDENT_REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "matric_number",
  "email",
  "phone",
  "state_of_origin",
  "next_of_kin_name",
  "next_of_kin_phone",
  "next_of_kin_email",
  "next_of_kin_relationship",
  "block",
  "room",
  "bedspace_label",
  "payment_id",
  "room_id",
] as const; 