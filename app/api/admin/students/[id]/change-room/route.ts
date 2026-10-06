import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { claimBedspace, releaseBedspace } from "@/shared/utils/room-beds";

/**
 * Super admin: change a student's room / bunk assignment.
 * Releases the old bed (if any), claims the new one, updates the student.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["super_admin"]);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const block = typeof body.block === "string" ? body.block.trim() : "";
    const room = typeof body.room === "string" ? body.room.trim() : "";
    const bedspace_label =
      typeof body.bedspace_label === "string"
        ? body.bedspace_label.trim()
        : "";
    const room_id =
      typeof body.room_id === "string" ? body.room_id.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!block || !room || !bedspace_label || !room_id) {
      return NextResponse.json(
        {
          success: false,
          error: "block, room, bedspace_label, and room_id are required",
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

    if (
      student.is_active === false ||
      student.account_status === "blacklisted"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot change room for a blacklisted / inactive student",
        },
        { status: 400 }
      );
    }

    const sameAssignment =
      student.block === block &&
      student.room === room &&
      student.bedspace_label === bedspace_label;

    if (sameAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: "Student is already assigned to this bedspace",
        },
        { status: 400 }
      );
    }

    const previous = {
      block: student.block,
      room: student.room,
      bedspace_label: student.bedspace_label,
    };

    // Verify target room exists and matches block/name
    const { data: targetRoom, error: targetRoomError } = await supabaseAdmin
      .from("rooms")
      .select("id, block, name, available_beds, room_availability_status")
      .eq("id", room_id)
      .maybeSingle();

    if (targetRoomError || !targetRoom) {
      return NextResponse.json(
        { success: false, error: "Target room not found" },
        { status: 404 }
      );
    }

    if (targetRoom.block !== block || targetRoom.name !== room) {
      return NextResponse.json(
        {
          success: false,
          error: "room_id does not match the provided block/room",
        },
        { status: 400 }
      );
    }

    // Ensure no other student occupies the target bed
    const { data: occupant } = await supabaseAdmin
      .from("students")
      .select("id, first_name, last_name")
      .eq("block", block)
      .eq("room", room)
      .eq("bedspace_label", bedspace_label)
      .neq("id", id)
      .maybeSingle();

    if (occupant) {
      return NextResponse.json(
        {
          success: false,
          error: `Bedspace is occupied by ${occupant.first_name} ${occupant.last_name}`,
        },
        { status: 409 }
      );
    }

    // Release current bed first so same-room moves free the old bunk
    let released = false;
    if (student.block && student.room && student.bedspace_label) {
      const release = await releaseBedspace(supabaseAdmin, {
        block: student.block,
        room: student.room,
        bedspace_label: student.bedspace_label,
      });
      released = release.released;
      if (!release.released) {
        console.warn("Change-room bed release warning:", release.error);
      }
    }

    const claim = await claimBedspace(supabaseAdmin, {
      roomId: room_id,
      bedspace_label,
    });

    if (!claim.claimed) {
      // Best-effort restore previous bed if we released it
      if (released && previous.block && previous.room && previous.bedspace_label) {
        const { data: prevRoom } = await supabaseAdmin
          .from("rooms")
          .select("id")
          .eq("block", previous.block)
          .eq("name", previous.room)
          .maybeSingle();
        if (prevRoom?.id) {
          await claimBedspace(supabaseAdmin, {
            roomId: prevRoom.id,
            bedspace_label: previous.bedspace_label,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: claim.error || "Failed to claim new bedspace",
        },
        { status: 409 }
      );
    }

    let updated = null as typeof student | null;
    let updateError: { message?: string; code?: string } | null = null;

    const withPrevious = await supabaseAdmin
      .from("students")
      .update({
        previous_block: previous.block,
        previous_room: previous.room,
        previous_bedspace_label: previous.bedspace_label,
        block,
        room,
        bedspace_label,
      })
      .eq("id", id)
      .select()
      .single();

    if (
      withPrevious.error &&
      (withPrevious.error.code === "PGRST204" ||
        withPrevious.error.message?.includes("previous_"))
    ) {
      const fallback = await supabaseAdmin
        .from("students")
        .update({ block, room, bedspace_label })
        .eq("id", id)
        .select()
        .single();
      updated = fallback.data;
      updateError = fallback.error;
    } else {
      updated = withPrevious.data;
      updateError = withPrevious.error;
    }

    if (updateError || !updated) {
      console.error("Change-room student update error:", updateError);
      // Attempt to undo bed claim and restore previous
      await releaseBedspace(supabaseAdmin, {
        block,
        room,
        bedspace_label,
      });
      if (previous.block && previous.room && previous.bedspace_label) {
        const { data: prevRoom } = await supabaseAdmin
          .from("rooms")
          .select("id")
          .eq("block", previous.block)
          .eq("name", previous.room)
          .maybeSingle();
        if (prevRoom?.id) {
          await claimBedspace(supabaseAdmin, {
            roomId: prevRoom.id,
            bedspace_label: previous.bedspace_label,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to update student room assignment",
        },
        { status: 500 }
      );
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "student_room_changed",
      resource_type: "student",
      resource_id: id,
      admin_user_id: admin.id,
      metadata: {
        reason: reason || null,
        from: previous,
        to: { block, room, bedspace_label, room_id },
        bed_released: released,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        student: updated,
        message: `Moved to Block ${block} Room ${room} · ${bedspace_label}`,
      },
    });
  } catch (error) {
    console.error("Change room error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
