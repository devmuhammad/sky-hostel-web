import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  getActiveSessionConfig,
  isValidSessionLabel,
  saveActiveSessionConfig,
  fullBedsForRoomType,
  suggestNextSessionLabel,
} from "@/shared/utils/active-session";
import { ensureStudentResumptionVerification } from "@/shared/utils/resumption-verification";

/**
 * GET — current active academic session (super_admin / admin).
 */
export async function GET() {
  try {
    await requireRole(["super_admin", "admin"]);
    const session = await getActiveSessionConfig(supabaseAdmin);
    return NextResponse.json({
      success: true,
      data: {
        ...session,
        suggestedNextLabel: suggestNextSessionLabel(session.label),
      },
    });
  } catch (error) {
    console.error("Get active session error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

/**
 * POST — open (or switch to) an academic session.
 * Super admin only. Optionally resets occupancy and seeds resumption rows.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["super_admin"]);
    const body = await request.json().catch(() => ({}));

    const sessionLabel =
      typeof body.sessionLabel === "string" ? body.sessionLabel.trim() : "";
    const confirmLabel =
      typeof body.confirmLabel === "string" ? body.confirmLabel.trim() : "";
    const feeAmount = Number(body.feeAmount);
    const resetOccupancy = body.resetOccupancy === true;
    const seedResumption = body.seedResumption !== false;

    if (!isValidSessionLabel(sessionLabel)) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionLabel must look like "2027/2028" (July–May cycle).',
        },
        { status: 400 }
      );
    }

    if (confirmLabel !== sessionLabel) {
      return NextResponse.json(
        {
          success: false,
          error: "confirmLabel must exactly match sessionLabel.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(feeAmount) || feeAmount < 1000) {
      return NextResponse.json(
        {
          success: false,
          error: "feeAmount must be at least ₦1,000.",
        },
        { status: 400 }
      );
    }

    const previous = await getActiveSessionConfig(supabaseAdmin);

    let clearedStudents = 0;
    let roomsReset = 0;
    let resumptionSeeded = 0;

    if (resetOccupancy) {
      const { data: occupied, error: occupiedError } = await supabaseAdmin
        .from("students")
        .select(
          "id, block, room, bedspace_label, is_active, account_status"
        )
        .not("bedspace_label", "is", null);

      if (occupiedError) {
        console.error("Occupied students lookup failed:", occupiedError);
        return NextResponse.json(
          { success: false, error: "Failed to load occupied students" },
          { status: 500 }
        );
      }

      const toClear = (occupied || []).filter(
        (s) =>
          s.account_status !== "blacklisted" && s.is_active !== false
      );

      for (const student of toClear) {
        const { error: clearError } = await supabaseAdmin
          .from("students")
          .update({
            previous_block: student.block,
            previous_room: student.room,
            previous_bedspace_label: student.bedspace_label,
            block: null,
            room: null,
            bedspace_label: null,
            payment_id: null,
            enrollment_session: null,
          })
          .eq("id", student.id);

        if (clearError) {
          // enrollment_session / previous_* may be missing before migrations
          if (
            clearError.code === "PGRST204" ||
            clearError.message?.includes("enrollment_session") ||
            clearError.message?.includes("previous_")
          ) {
            const { error: fallbackError } = await supabaseAdmin
              .from("students")
              .update({
                block: null,
                room: null,
                bedspace_label: null,
                payment_id: null,
              })
              .eq("id", student.id);
            if (fallbackError) {
              console.error("Failed clearing student", student.id, fallbackError);
              continue;
            }
          } else {
            console.error("Failed clearing student", student.id, clearError);
            continue;
          }
        }
        clearedStudents += 1;
      }

      const { data: rooms, error: roomsError } = await supabaseAdmin
        .from("rooms")
        .select("id, bed_type");

      if (roomsError) {
        console.error("Rooms lookup failed:", roomsError);
        return NextResponse.json(
          { success: false, error: "Failed to load rooms for reset" },
          { status: 500 }
        );
      }

      for (const room of rooms || []) {
        const beds = fullBedsForRoomType(room.bed_type);
        const { error: roomUpdateError } = await supabaseAdmin
          .from("rooms")
          .update({ available_beds: beds })
          .eq("id", room.id);
        if (roomUpdateError) {
          console.error("Room reset failed", room.id, roomUpdateError);
          continue;
        }
        roomsReset += 1;
      }
    }

    const session = await saveActiveSessionConfig(supabaseAdmin, {
      label: sessionLabel,
      feeAmount,
      openedBy: admin.id,
    });

    if (seedResumption) {
      const { data: students, error: studentsError } = await supabaseAdmin
        .from("students")
        .select("id, is_active, account_status");

      if (studentsError) {
        console.warn("Resumption seed student list failed:", studentsError);
      } else {
        for (const student of students || []) {
          if (
            student.account_status === "blacklisted" ||
            student.is_active === false
          ) {
            continue;
          }
          const id = await ensureStudentResumptionVerification(
            supabaseAdmin,
            student.id,
            sessionLabel
          );
          if (id) resumptionSeeded += 1;
        }
      }
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "academic_session_opened",
      resource_type: "app_settings",
      resource_id: admin.id,
      admin_user_id: admin.id,
      metadata: {
        previous_label: previous.label,
        previous_fee: previous.feeAmount,
        session_label: session.label,
        fee_amount: session.feeAmount,
        reset_occupancy: resetOccupancy,
        seed_resumption: seedResumption,
        cleared_students: clearedStudents,
        rooms_reset: roomsReset,
        resumption_seeded: resumptionSeeded,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
        previous,
        resetOccupancy,
        seedResumption,
        clearedStudents,
        roomsReset,
        resumptionSeeded,
        message: `Session ${session.label} is now active (₦${session.feeAmount.toLocaleString()}).`,
      },
    });
  } catch (error) {
    console.error("Open academic session error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to open session";
    if (message === "Unauthorized" || message.includes("Unauthorized")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
