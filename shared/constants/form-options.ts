export const MARITAL_STATUS_OPTIONS = [
  { value: "", label: "Select status" },
  { value: "Single", label: "Single" },
  { value: "Married", label: "Married" },
  { value: "Divorced", label: "Divorced" },
  { value: "Widowed", label: "Widowed" },
] as const;

export const LEVEL_OPTIONS = [
  { value: "", label: "Select level" },
  { value: "100", label: "100 Level" },
  { value: "200", label: "200 Level" },
  { value: "300", label: "300 Level" },
  { value: "400", label: "400 Level" },
  { value: "500", label: "500 Level" },
  { value: "600", label: "600 Level" },
  { value: "Masters", label: "Masters" },
] as const;

export const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Select relationship" },
  { value: "Parent", label: "Parent" },
  { value: "Guardian", label: "Guardian" },
  { value: "Sibling", label: "Sibling" },
  { value: "Spouse", label: "Spouse" },
  { value: "Relative", label: "Relative" },
  { value: "Friend", label: "Friend" },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const ADMIN_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
] as const; 