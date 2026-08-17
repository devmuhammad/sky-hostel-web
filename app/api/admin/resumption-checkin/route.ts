import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { RESUMPTION_SESSION } from "@/shared/constants/resumption-documents";
import { getResumptionChecklistBundle } from "@/shared/utils/resumption-verification";

const STAFF_ROLES = ["super_admin", "admin", "porter", "other"];

export async function GET(request: NextRequest) {
  try {
    await requireRole(STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("student_id");
    const q = (searchParams.get("q") || "").trim();
    const sessionLabel =
      searchParams.get("session") || RESUMPTION_SESSION;

    if (studentId) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from("students")
        .select(
          "id, first_name, last_name, email, phone, matric_number, faculty, department, level, block, room, bedspace_label, passport_photo_url"
        )
        .eq("id", studentId)
        .single();

      if (studentError || !student) {
        return NextResponse.json(
          { success: false, error: "Student not found" },
          { status: 404 }
        );
      }

      const bundle = await getResumptionChecklistBundle(
        supabaseAdmin,
        student.id,
        sessionLabel
      );

      return NextResponse.json({
        success: true,
        data: {
          student,
          ...bundle,
        },
      });
    }

    if (!q || q.length < 2) {
      return NextResponse.json(
        { success: false, error: "Provide student_id or a search query (min 2 characters)" },
        { status: 400 }
      );
    }

    const pattern = `%${q}%`;
    const { data: students, error } = await supabaseAdmin
      .from("students")
      .select(
        "id, first_name, last_name, email, phone, matric_number, block, room, bedspace_label, passport_photo_url"
      )
      .or(
        `first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},matric_number.ilike.${pattern},phone.ilike.${pattern},room.ilike.${pattern}`
      )
      .order("last_name", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Resumption search error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to search students" },
        { status: 500 }
      );
    }

    const studentIds = (students || []).map((s) => s.id);
    let statusByStudent = new Map<string, string>();

    if (studentIds.length > 0) {
      const { data: verifications } = await supabaseAdmin
        .from("student_resumption_verifications")
        .select("student_id, status")
        .eq("session_label", sessionLabel)
        .in("student_id", studentIds);

      statusByStudent = new Map(
        (verifications || []).map((v) => [v.student_id as string, v.status as string])
      );
    }

    return NextResponse.json({
      success: true,
      data: (students || []).map((student) => ({
        ...student,
        resumption_status: statusByStudent.get(student.id) || "pending",
      })),
    });
  } catch (error) {
    console.error("Admin resumption GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireRole(STAFF_ROLES);
    const body = await request.json();

    const studentId = body.student_id as string | undefined;
    const sessionLabel = (body.session as string) || RESUMPTION_SESSION;
    const status = body.status as "pending" | "cleared" | "denied" | undefined;
    const deniedReason =
      typeof body.denied_reason === "string" ? body.denied_reason : undefined;
    const agreementSubmitted =
      typeof body.agreement_submitted === "boolean"
        ? body.agreement_submitted
        : undefined;
    const itemChecks = Array.isArray(body.item_checks)
      ? (body.item_checks as Array<{
          item_id: string;
          present: boolean | null;
          sold_at_gate?: boolean | null;
        }>)
      : [];

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "student_id is required" },
        { status: 400 }
      );
    }

    const bundle = await getResumptionChecklistBundle(
      supabaseAdmin,
      studentId,
      sessionLabel
    );

    if (!bundle.verification?.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Resumption verification is unavailable. Apply migration 12 first.",
        },
        { status: 500 }
      );
    }

    const verificationId = bundle.verification.id as string;
    const now = new Date().toISOString();

    for (const check of itemChecks) {
      if (!check.item_id) continue;

      const { error: upsertError } = await supabaseAdmin
        .from("student_resumption_item_checks")
        .upsert(
          {
            verification_id: verificationId,
            item_id: check.item_id,
            present: check.present,
            sold_at_gate: check.sold_at_gate ?? null,
            checked_by: admin.id,
            checked_at: now,
          },
          { onConflict: "verification_id,item_id" }
        );

      if (upsertError) {
        console.error("Item check upsert error:", upsertError);
        return NextResponse.json(
          { success: false, error: "Failed to save checklist items" },
          { status: 500 }
        );
      }
    }

    // Re-read checks after upserts to evaluate clearance
    const refreshed = await getResumptionChecklistBundle(
      supabaseAdmin,
      studentId,
      sessionLabel
    );

    let nextStatus = status || refreshed.verification?.status || "pending";
    let agreement =
      agreementSubmitted ??
      refreshed.verification?.agreement_submitted ??
      false;

    const signedItem = refreshed.checklist.find(
      (item: any) => item.code === "signed_agreement"
    );
    if (signedItem?.present === true) {
      agreement = true;
    }

    if (status === "cleared") {
      const mandatoryIncomplete = refreshed.checklist.some(
        (item: any) => item.is_mandatory && item.present !== true
      );
      if (mandatoryIncomplete) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot grant entry until every mandatory checklist item is marked Present (YES).",
          },
          { status: 400 }
        );
      }
      nextStatus = "cleared";
    } else if (status === "denied") {
      nextStatus = "denied";
    }

    const verificationUpdate: Record<string, unknown> = {
      status: nextStatus,
      agreement_submitted: agreement,
      verified_at: now,
      verified_by: admin.id,
    };

    if (nextStatus === "cleared") {
      verificationUpdate.cleared_at = now;
      verificationUpdate.cleared_by = admin.id;
      verificationUpdate.denied_reason = null;
    } else if (nextStatus === "denied") {
      verificationUpdate.cleared_at = null;
      verificationUpdate.cleared_by = null;
      verificationUpdate.denied_reason = deniedReason || null;
    } else if (deniedReason !== undefined) {
      verificationUpdate.denied_reason = deniedReason || null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("student_resumption_verifications")
      .update(verificationUpdate)
      .eq("id", verificationId);

    if (updateError) {
      console.error("Verification update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update verification" },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "resumption_verification_updated",
      resource_type: "student",
      resource_id: studentId,
      admin_user_id: admin.id,
      metadata: {
        session_label: sessionLabel,
        status: nextStatus,
        agreement_submitted: agreement,
      },
    });

    const finalBundle = await getResumptionChecklistBundle(
      supabaseAdmin,
      studentId,
      sessionLabel
    );

    const { data: student } = await supabaseAdmin
      .from("students")
      .select(
        "id, first_name, last_name, email, phone, matric_number, faculty, department, level, block, room, bedspace_label, passport_photo_url"
      )
      .eq("id", studentId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        student,
        ...finalBundle,
      },
    });
  } catch (error) {
    console.error("Admin resumption PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
