import { z } from "zod";

/**
 * Basic HTML entity encoding to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Remove HTML tags from string
 */
export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize and trim string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }

  return stripHtml(input.trim());
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeString(email).toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error("Invalid email format");
  }

  return sanitized;
}

/**
 * Sanitize phone number - remove all non-digit characters
 */
export function sanitizePhone(phone: string): string {
  const sanitized = sanitizeString(phone);
  const digitsOnly = sanitized.replace(/\D/g, "");

  if (digitsOnly.length < 10) {
    throw new Error("Phone number must have at least 10 digits");
  }

  return digitsOnly;
}

/**
 * Sanitize name fields - allow only letters, spaces, hyphens, and apostrophes
 */
export function sanitizeName(name: string): string {
  const sanitized = sanitizeString(name);

  // Allow only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(sanitized)) {
    throw new Error(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    );
  }

  return sanitized;
}

/**
 * Sanitize matric number - allow alphanumeric and common separators
 */
export function sanitizeMatricNumber(matricNumber: string): string {
  const sanitized = sanitizeString(matricNumber).toUpperCase();

  // Allow letters, numbers, slashes, and hyphens
  const matricRegex = /^[A-Z0-9\/\-]+$/;
  if (!matricRegex.test(sanitized)) {
    throw new Error(
      "Matric number can only contain letters, numbers, slashes, and hyphens"
    );
  }

  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number {
  const num = typeof input === "string" ? parseFloat(input) : input;

  if (isNaN(num)) {
    throw new Error("Input must be a valid number");
  }

  return num;
}

/**
 * Sanitize object by applying appropriate sanitization to each field
 */
export function sanitizeStudentData(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    throw new Error("Data must be an object");
  }

  try {
    return {
      // Personal Information
      first_name: data.first_name ? sanitizeName(data.first_name as string) : undefined,
      last_name: data.last_name ? sanitizeName(data.last_name as string) : undefined,
      email: data.email ? sanitizeEmail(data.email as string) : undefined,
      phone: data.phone ? sanitizePhone(data.phone as string) : undefined,
      date_of_birth: data.date_of_birth
        ? sanitizeString(data.date_of_birth as string)
        : undefined,
      address: data.address ? sanitizeString(data.address as string) : undefined,
      state_of_origin: data.state_of_origin
        ? sanitizeString(data.state_of_origin as string)
        : undefined,
      lga: data.lga ? sanitizeString(data.lga as string) : undefined,
      marital_status: data.marital_status
        ? sanitizeString(data.marital_status as string)
        : undefined,
      religion: data.religion ? sanitizeString(data.religion as string) : undefined,

      // Academic Information
      matric_number: data.matric_number
        ? sanitizeMatricNumber(data.matric_number as string)
        : undefined,
      course: data.course ? sanitizeString(data.course as string) : undefined,
      level: data.level ? sanitizeString(data.level as string) : undefined,
      faculty: data.faculty ? sanitizeString(data.faculty as string) : undefined,
      department: data.department ? sanitizeString(data.department as string) : undefined,

      // Next of Kin Information
      next_of_kin_name: data.next_of_kin_name
        ? sanitizeName(data.next_of_kin_name as string)
        : undefined,
      next_of_kin_phone: data.next_of_kin_phone
        ? sanitizePhone(data.next_of_kin_phone as string)
        : undefined,
      next_of_kin_email: data.next_of_kin_email
        ? sanitizeEmail(data.next_of_kin_email as string)
        : undefined,
      next_of_kin_relationship: data.next_of_kin_relationship
        ? sanitizeString(data.next_of_kin_relationship as string)
        : undefined,

      // Accommodation Information
      block: data.block ? sanitizeString(data.block as string) : undefined,
      room: data.room ? sanitizeString(data.room as string) : undefined,
      bedspace_label: data.bedspace_label
        ? sanitizeString(data.bedspace_label as string)
        : undefined,

      // System Information
      payment_id: data.payment_id ? sanitizeString(data.payment_id as string) : undefined,
      room_id: data.room_id ? sanitizeString(data.room_id as string) : undefined,

      // File Storage
      passport_photo_url: data.passport_photo_url
        ? sanitizeString(data.passport_photo_url as string)
        : undefined,
    };
  } catch (error) {
    throw new Error(
      `Data sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Sanitize payment data
 */
export function sanitizePaymentData(
  data: Record<string, unknown>
): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    throw new Error("Payment data must be an object");
  }

  try {
    return {
      firstName: data.firstName ? sanitizeName(data.firstName as string) : undefined,
      lastName: data.lastName ? sanitizeName(data.lastName as string) : undefined,
      email: data.email ? sanitizeEmail(data.email as string) : undefined,
      phone: data.phone ? sanitizePhone(data.phone as string) : undefined,
      amount: data.amount ? sanitizeNumber(data.amount as string | number) : undefined,
    };
  } catch (error) {
    throw new Error(
      `Payment data sanitization failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generic object sanitizer - recursively sanitizes string values
 */
export function sanitizeObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as Record<string, unknown>;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj as unknown as Record<string, unknown>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item as Record<string, unknown>)) as unknown as Record<string, unknown>;
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    }
    return sanitized;
  }

  return obj;
}
