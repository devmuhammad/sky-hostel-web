import { supabaseAdmin } from "@/shared/config/supabase";
import { getActiveSessionConfig } from "@/shared/utils/active-session";
import { cancelPaycashlessInvoice } from "@/shared/utils/paycashless-admin";
import { releaseBedspace } from "@/shared/utils/room-beds";
import {
  isStudentBlocked,
  REFUND_ADMIN_ROLES,
} from "@/shared/utils/student-eligibility";

export { REFUND_ADMIN_ROLES };

export type RefundResult = {
  payment: Record<string, unknown> | null;
  student: Record<string, unknown> | null;
  bed_released: boolean;
  invoice_cancelled: boolean;
  invoice_cancel_error: string | null;
  message: string;
};

type RefundFailure = {
  ok: false;
  status: number;
  error: string;
};

type RefundSuccess = {
  ok: true;
  data: RefundResult;
};

function paycashlessInvoiceId(payment: {
  paycashless_invoice_id?: string | null;
  invoice_id?: string | null;
  payment_source?: string | null;
}): string | null {
  if (
    payment.payment_source &&
    payment.payment_source !== "paycashless"
  ) {
    return null;
  }
  if (
    payment.paycashless_invoice_id &&
    String(payment.paycashless_invoice_id).startsWith("inv_")
  ) {
    return String(payment.paycashless_invoice_id);
  }
  if (payment.invoice_id && String(payment.invoice_id).startsWith("inv_")) {
    return String(payment.invoice_id);
  }
  return null;
}

async function markPaymentRefunded(
  paymentId: string,
  adminId: string,
  reason: string,
  now: string
) {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .update({
      status: "refunded",
      refunded_at: now,
      refunded_by: adminId,
      refund_reason: reason,
      updated_at: now,
    })
    .eq("id", paymentId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      error?.message?.includes("refunded") || error?.code === "PGRST204"
        ? "Refund columns missing. Apply migration 17 first."
        : error?.message || "Failed to mark payment as refunded"
    );
  }

  return data;
}

async function cancelInvoiceIfPossible(
  payment: {
    paycashless_invoice_id?: string | null;
    invoice_id?: string | null;
    payment_source?: string | null;
  },
  reason: string
): Promise<{ cancelled: boolean; error: string | null }> {
  const invoiceId = paycashlessInvoiceId(payment);
  if (!invoiceId) {
    return { cancelled: false, error: null };
  }

  const result = await cancelPaycashlessInvoice(invoiceId, reason);
  if (result.success) {
    return { cancelled: true, error: null };
  }
  return { cancelled: false, error: result.error || "Invoice cancel failed" };
}

async function findStudentForPayment(payment: Record<string, any>) {
  if (payment.id) {
    const { data: byPaymentId } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("payment_id", payment.id)
      .maybeSingle();
    if (byPaymentId) return byPaymentId;
  }

  if (!payment.email) return null;

  let query = supabaseAdmin
    .from("students")
    .select("*")
    .ilike("email", payment.email);

  if (payment.session_label) {
    query = query.eq("enrollment_session", payment.session_label);
  }

  const { data } = await query.maybeSingle();
  if (data) return data;

  const { data: byEmail } = await supabaseAdmin
    .from("students")
    .select("*")
    .ilike("email", payment.email)
    .maybeSingle();
  return byEmail || null;
}

async function findPaymentForStudent(student: {
  payment_id?: string | null;
  email?: string | null;
  enrollment_session?: string | null;
}) {
  if (student.payment_id) {
    const { data } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", student.payment_id)
      .maybeSingle();
    if (data) return data;
  }

  if (!student.email) return null;

  const activeSession = await getActiveSessionConfig(supabaseAdmin);
  const sessionLabel = student.enrollment_session || activeSession.label;

  const { data } = await supabaseAdmin
    .from("payments")
    .select("*")
    .ilike("email", student.email)
    .eq("session_label", sessionLabel)
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function withdrawRegisteredStudent(params: {
  student: Record<string, any>;
  sessionLabel?: string | null;
  reason: string;
  adminId: string;
  now: string;
}): Promise<{
  student: Record<string, any> | null;
  bedReleased: boolean;
  withdrew: boolean;
}> {
  const { student, sessionLabel, reason, adminId, now } = params;

  if (isStudentBlocked(student)) {
    return { student, bedReleased: false, withdrew: false };
  }

  const enrolledThisSession =
    Boolean(student.bedspace_label) ||
    (sessionLabel && student.enrollment_session === sessionLabel);

  if (!enrolledThisSession) {
    return { student: null, bedReleased: false, withdrew: false };
  }

  const release = await releaseBedspace(supabaseAdmin, {
    block: student.block,
    room: student.room,
    bedspace_label: student.bedspace_label,
  });

  if (
    !release.released &&
    student.block &&
    student.room &&
    student.bedspace_label
  ) {
    console.warn("Refund bed release warning:", release.error);
  }

  try {
    await supabaseAdmin
      .from("inventory_items")
      .update({ assigned_to: null })
      .eq("assigned_to", student.id);
  } catch (inventoryError) {
    console.warn("Inventory unassign skipped:", inventoryError);
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("students")
    .update({
      is_active: false,
      account_status: "withdrawn",
      deactivated_at: now,
      deactivated_by: adminId,
      deactivation_reason: reason,
      previous_block: student.block,
      previous_room: student.room,
      previous_bedspace_label: student.bedspace_label,
      block: null,
      room: null,
      bedspace_label: null,
    })
    .eq("id", student.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(
      updateError.message?.includes("account_status") ||
        updateError.code === "PGRST204"
        ? "Student status columns missing. Apply migration 13 first."
        : updateError.message || "Failed to withdraw student"
    );
  }

  return { student: updated, bedReleased: release.released, withdrew: true };
}

function refundMessage(params: {
  hadPayment: boolean;
  hadStudent: boolean;
  bedReleased: boolean;
  invoiceCancelled: boolean;
}): string {
  const parts: string[] = [];
  if (params.hadPayment) {
    parts.push("Payment refunded in Sky Hostel.");
  }
  if (params.hadStudent && params.bedReleased) {
    parts.push("The student was withdrawn and their bed is available again.");
  } else if (params.hadStudent) {
    parts.push("The student was withdrawn and cannot continue registration.");
  } else if (params.hadPayment) {
    parts.push("They cannot continue payment or registration for this session.");
  }
  if (params.invoiceCancelled) {
    parts.push("The Paycashless invoice was cancelled.");
  } else if (params.hadPayment) {
    parts.push(
      "If money was collected, return it in the Paycashless dashboard."
    );
  }
  return parts.join(" ");
}

export async function processRefund(params: {
  paymentId?: string;
  studentId?: string;
  reason: string;
  adminId: string;
}): Promise<RefundSuccess | RefundFailure> {
  const reason = params.reason.trim();
  if (!reason || reason.length < 5) {
    return {
      ok: false,
      status: 400,
      error: "A refund reason is required (min 5 characters).",
    };
  }

  if (!params.paymentId && !params.studentId) {
    return {
      ok: false,
      status: 400,
      error: "Payment or student id is required.",
    };
  }

  let payment: Record<string, any> | null = null;
  let student: Record<string, any> | null = null;

  if (params.studentId) {
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("id", params.studentId)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, status: 404, error: "Student not found" };
    }
    student = data;
  }

  if (params.paymentId) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", params.paymentId)
      .maybeSingle();
    if (error || !data) {
      return { ok: false, status: 404, error: "Payment not found" };
    }
    payment = data;
  } else if (student) {
    payment = await findPaymentForStudent(student);
  }

  const alreadyRefunded = payment?.status === "refunded";

  if (!payment && !student) {
    return {
      ok: false,
      status: 404,
      error: "No payment or student found to refund.",
    };
  }

  const now = new Date().toISOString();
  let invoiceCancelled = false;
  let invoiceCancelError: string | null = null;
  let refundedPayment = payment;

  if (payment && !alreadyRefunded) {
    const cancel = await cancelInvoiceIfPossible(payment, reason);
    invoiceCancelled = cancel.cancelled;
    invoiceCancelError = cancel.error;

    try {
      refundedPayment = await markPaymentRefunded(
        payment.id,
        params.adminId,
        reason,
        now
      );
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error: error instanceof Error ? error.message : "Failed to refund payment",
      };
    }

    const sessionLabel = payment.session_label;
    if (payment.email && sessionLabel) {
      const { data: siblings } = await supabaseAdmin
        .from("payments")
        .select(
          "id, status, paycashless_invoice_id, invoice_id, payment_source"
        )
        .ilike("email", payment.email)
        .eq("session_label", sessionLabel)
        .in("status", ["pending", "partially_paid", "completed"])
        .neq("id", payment.id);

      for (const sibling of siblings || []) {
        try {
          await cancelInvoiceIfPossible(sibling, reason);
          await markPaymentRefunded(sibling.id, params.adminId, reason, now);
        } catch (siblingError) {
          console.warn("Sibling payment refund skipped:", siblingError);
        }
      }
    }
  }

  if (!student && refundedPayment) {
    student = await findStudentForPayment(refundedPayment);
  }

  let withdrawnStudent: Record<string, any> | null = null;
  let bedReleased = false;
  let withdrew = false;

  if (student) {
    try {
      const withdrawn = await withdrawRegisteredStudent({
        student,
        sessionLabel:
          refundedPayment?.session_label || student.enrollment_session,
        reason,
        adminId: params.adminId,
        now,
      });
      withdrawnStudent = withdrawn.student;
      bedReleased = withdrawn.bedReleased;
      withdrew = withdrawn.withdrew;
    } catch (error) {
      return {
        ok: false,
        status: 500,
        error:
          error instanceof Error ? error.message : "Failed to withdraw student",
      };
    }
  }

  if (alreadyRefunded && !withdrew) {
    return {
      ok: false,
      status: 400,
      error: "This payment has already been refunded.",
    };
  }

  if (!refundedPayment && !withdrew) {
    return {
      ok: false,
      status: 400,
      error: "No payment found to refund for this student.",
    };
  }

  await supabaseAdmin.from("activity_logs").insert({
    action: "payment_refunded",
    resource_type: refundedPayment ? "payment" : "student",
    resource_id: refundedPayment?.id || student?.id,
    admin_user_id: params.adminId,
    metadata: {
      reason,
      payment_id: refundedPayment?.id || null,
      student_id: student?.id || withdrawnStudent?.id || null,
      bed_released: bedReleased,
      invoice_cancelled: invoiceCancelled,
      invoice_cancel_error: invoiceCancelError,
      previous_block: student?.block || null,
      previous_room: student?.room || null,
      previous_bedspace: student?.bedspace_label || null,
    },
  });

  const resultStudent = withdrawnStudent || (isStudentBlocked(student) ? student : null);

  return {
    ok: true,
    data: {
      payment: refundedPayment,
      student: resultStudent,
      bed_released: bedReleased,
      invoice_cancelled: invoiceCancelled,
      invoice_cancel_error: invoiceCancelError,
      message: refundMessage({
        hadPayment: Boolean(refundedPayment),
        hadStudent: withdrew,
        bedReleased,
        invoiceCancelled,
      }),
    },
  };
}
