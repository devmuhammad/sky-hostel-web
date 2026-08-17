import { RESUMPTION_SESSION } from "@/shared/constants/resumption-documents";

type SupabaseLike = {
  from: (table: string) => any;
};

/**
 * Ensures a pending resumption verification exists for a student.
 * Safe to call repeatedly; ignores missing-table errors so registration
 * still succeeds before migration 12 is applied.
 */
export async function ensureStudentResumptionVerification(
  supabase: SupabaseLike,
  studentId: string,
  sessionLabel: string = RESUMPTION_SESSION
) {
  try {
    const { data: existing, error: existingError } = await supabase
      .from("student_resumption_verifications")
      .select("id")
      .eq("student_id", studentId)
      .eq("session_label", sessionLabel)
      .maybeSingle();

    if (existingError) {
      // Table may not exist yet (migration not applied)
      if (existingError.code === "42P01" || existingError.code === "PGRST205") {
        console.warn(
          "Resumption verification table missing; skip seeding until migration 12"
        );
        return null;
      }
      console.error("Resumption verification lookup failed:", existingError);
      return null;
    }

    if (existing?.id) {
      return existing.id as string;
    }

    const { data: created, error: createError } = await supabase
      .from("student_resumption_verifications")
      .insert({
        student_id: studentId,
        session_label: sessionLabel,
        status: "pending",
      })
      .select("id")
      .single();

    if (createError) {
      if (createError.code === "42P01" || createError.code === "PGRST205") {
        return null;
      }
      console.error("Resumption verification create failed:", createError);
      return null;
    }

    return (created?.id as string) || null;
  } catch (error) {
    console.error("ensureStudentResumptionVerification error:", error);
    return null;
  }
}

export async function getResumptionChecklistBundle(
  supabase: SupabaseLike,
  studentId: string,
  sessionLabel: string = RESUMPTION_SESSION
) {
  await ensureStudentResumptionVerification(supabase, studentId, sessionLabel);

  const { data: items, error: itemsError } = await supabase
    .from("resumption_checklist_items")
    .select("id, code, label, sort_order, is_mandatory, active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    throw itemsError;
  }

  const { data: verification, error: verificationError } = await supabase
    .from("student_resumption_verifications")
    .select(
      `
      id,
      student_id,
      session_label,
      status,
      agreement_submitted,
      denied_reason,
      cleared_at,
      cleared_by,
      verified_at,
      verified_by,
      created_at,
      updated_at
    `
    )
    .eq("student_id", studentId)
    .eq("session_label", sessionLabel)
    .maybeSingle();

  if (verificationError) {
    throw verificationError;
  }

  let checks: any[] = [];
  if (verification?.id) {
    const { data: checkRows, error: checksError } = await supabase
      .from("student_resumption_item_checks")
      .select(
        "id, verification_id, item_id, present, sold_at_gate, checked_by, checked_at"
      )
      .eq("verification_id", verification.id);

    if (checksError) {
      throw checksError;
    }
    checks = checkRows || [];
  }

  const checksByItem = new Map(
    checks.map((row) => [row.item_id as string, row])
  );

  const checklist = (items || []).map((item: any) => {
    const check = checksByItem.get(item.id);
    return {
      ...item,
      present: check?.present ?? null,
      sold_at_gate: check?.sold_at_gate ?? null,
      checked_at: check?.checked_at ?? null,
      checked_by: check?.checked_by ?? null,
      check_id: check?.id ?? null,
    };
  });

  return {
    verification: verification || null,
    checklist,
  };
}
