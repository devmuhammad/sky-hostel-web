import { getAcademicSessionForDate } from "@/shared/config/academic-session";

export type StudentStatsInput = {
  is_active?: boolean | null;
  account_status?: string | null;
  enrollment_session?: string | null;
  created_at?: string | null;
  bedspace_label?: string | null;
  block?: string | null;
  room?: string | null;
  faculty?: string | null;
  level?: string | null;
  state_of_origin?: string | null;
};

export type PaymentStatsInput = {
  amount_paid?: number | string | null;
  status?: string | null;
  session_label?: string | null;
  created_at?: string | null;
  payment_source?: string | null;
};

export type RoomStatsInput = {
  total_beds?: number | null;
};

export type HostelStats = {
  totalStudents: number;
  completedPayments: number;
  collectedPayments: number;
  totalRevenue: number;
  occupiedBeds: number;
  totalBeds: number;
  occupancyRate: number;
  sessionLabel: string;
};

export function isCurrentStudent(student: StudentStatsInput): boolean {
  if (student.is_active === false) return false;
  if (student.account_status === "blacklisted") return false;
  if (student.account_status === "withdrawn") return false;
  return true;
}

export function studentInSession(
  student: StudentStatsInput,
  sessionLabel: string
): boolean {
  if (!isCurrentStudent(student)) return false;

  if (student.enrollment_session) {
    return student.enrollment_session === sessionLabel;
  }

  // Rows from before enrollment_session existed: use registration date.
  if (!student.created_at) return false;
  return getAcademicSessionForDate(student.created_at) === sessionLabel;
}

export function paymentInSession(
  payment: PaymentStatsInput,
  sessionLabel: string
): boolean {
  if (payment.session_label) {
    return payment.session_label === sessionLabel;
  }
  if (!payment.created_at) return false;
  return getAcademicSessionForDate(payment.created_at) === sessionLabel;
}

export function isCashCollected(payment: PaymentStatsInput): boolean {
  const source = payment.payment_source || "paycashless";
  if (source !== "paycashless") return false;
  return payment.status === "completed" || payment.status === "partially_paid";
}

export function cashReceived(payment: PaymentStatsInput): number {
  if (!isCashCollected(payment)) return 0;
  return Number(payment.amount_paid) || 0;
}

export function hasAssignedBed(student: StudentStatsInput): boolean {
  return Boolean(
    student.bedspace_label && student.block && student.room
  );
}

export function computeHostelStats(params: {
  students: StudentStatsInput[];
  payments: PaymentStatsInput[];
  rooms: RoomStatsInput[];
  sessionLabel: string;
}): HostelStats {
  const sessionStudents = params.students.filter((student) =>
    studentInSession(student, params.sessionLabel)
  );
  const sessionPayments = params.payments.filter((payment) =>
    paymentInSession(payment, params.sessionLabel)
  );

  const completedPayments = sessionPayments.filter(
    (payment) => payment.status === "completed"
  ).length;
  const collectedPayments = sessionPayments.filter(isCashCollected).length;
  const totalRevenue = sessionPayments.reduce(
    (sum, payment) => sum + cashReceived(payment),
    0
  );

  const totalBeds = params.rooms.reduce(
    (sum, room) => sum + (Number(room.total_beds) || 0),
    0
  );
  const occupiedBeds = params.students.filter(hasAssignedBed).length;
  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return {
    totalStudents: sessionStudents.length,
    completedPayments,
    collectedPayments,
    totalRevenue,
    occupiedBeds,
    totalBeds,
    occupancyRate,
    sessionLabel: params.sessionLabel,
  };
}
