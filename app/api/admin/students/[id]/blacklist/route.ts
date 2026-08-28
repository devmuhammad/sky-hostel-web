import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { releaseBedspace } from "@/shared/utils/room-beds";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["super_admin"]);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "A deactivation reason is required (min 5 characters).",
        },
        { status: 400 }
      );
    }

    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (student.is_active === false || student.account_status === "blacklisted") {
      return NextResponse.json(
        { success: false, error: "Student is already blacklisted / inactive" },
        { status: 400 }
      );
    }

    const release = await releaseBedspace(supabaseAdmin, {
      block: student.block,
      room: student.room,
      bedspace_label: student.bedspace_label,
    });

    if (!release.released && student.block && student.room && student.bedspace_label) {
      console.warn("Bed release warning:", release.error);
    }

    // Clear inventory assignment if any (ignore if table/column unavailable)
    try {
      await supabaseAdmin
        .from("inventory_items")
        .update({ assigned_to: null })
        .eq("assigned_to", id);
    } catch (inventoryError) {
      console.warn("Inventory unassign skipped:", inventoryError);
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("students")
      .update({
        is_active: false,
        account_status: "blacklisted",
        deactivated_at: now,
        deactivated_by: admin.id,
        deactivation_reason: reason,
        previous_block: student.block,
        previous_room: student.room,
        previous_bedspace_label: student.bedspace_label,
        block: null,
        room: null,
        bedspace_label: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Blacklist update error:", updateError);
      return NextResponse.json(
        {
          success: false,
          error:
            updateError.message?.includes("is_active") ||
            updateError.code === "PGRST204"
              ? "Blacklist columns missing. Apply migration 13 first."
              : "Failed to blacklist student",
        },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "student_blacklisted",
      resource_type: "student",
      resource_id: id,
      admin_user_id: admin.id,
      metadata: {
        reason,
        previous_block: student.block,
        previous_room: student.room,
        previous_bedspace: student.bedspace_label,
        bed_released: release.released,
        bed_release_error: release.error || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        student: updated,
        bed_released: release.released,
        message:
          "Student blacklisted. Room bed freed. They cannot register again.",
      },
    });
  } catch (error) {
    console.error("Blacklist student error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
