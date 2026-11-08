export const REFUND_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "hostel_manager",
] as const;

export function isStudentBlocked(student: {
  is_active?: boolean | null;
  account_status?: string | null;
} | null | undefined): boolean {
  if (!student) return false;
  return (
    student.is_active === false ||
    student.account_status === "blacklisted" ||
    student.account_status === "withdrawn"
  );
}

export function isPaymentRefunded(payment: {
  status?: string | null;
} | null | undefined): boolean {
  return payment?.status === "refunded";
}

export const STUDENT_INELIGIBLE_MESSAGE =
  "This email is not eligible for hostel registration. Please contact the hostel office.";

export const PAYMENT_REFUNDED_MESSAGE =
  "This payment was refunded. You cannot continue hostel registration. Please contact the hostel office.";
