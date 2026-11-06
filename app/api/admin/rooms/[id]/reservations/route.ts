import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  expectedBedLabels,
  parseBedReservations,
  syncRoomAvailability,
} from "@/shared/utils/room-availability";

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "hostel_manager",
  "porter",
  "other",
];

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    Boolean(error.message?.includes("bed_reservations"))
  );
}

async function loadRoom(id: string) {
  const withReservations = await supabaseAdmin
    .from("rooms")
    .select(
      "id, block, name, total_beds, available_beds, room_availability_status, bed_reservations"
    )
    .eq("id", id)
    .maybeSingle();

  if (withReservations.error && isMissingColumnError(withReservations.error)) {
    return {
      error: "Apply migration 16 to enable per-bed reservations",
      room: null,
    };
  }

  if (withReservations.error || !withReservations.data) {
    return { error: "Room not found", room: null };
  }

  return { error: null, room: withReservations.data };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const bedspace_label =
      typeof body.bedspace_label === "string" ? body.bedspace_label.trim() : "";
    const reserved_for_name =
      typeof body.reserved_for_name === "string"
        ? body.reserved_for_name.trim()
        : "";

    if (!bedspace_label || !reserved_for_name) {
      return NextResponse.json(
        {
          success: false,
          error: "bedspace_label and reserved_for_name are required",
        },
        { status: 400 }
      );
    }

    const loaded = await loadRoom(id);
    if (!loaded.room) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.error?.includes("migration") ? 409 : 404 }
      );
    }

    const room = loaded.room;
    const expected = expectedBedLabels(Number(room.total_beds || 0));
    if (!expected.includes(bedspace_label)) {
      return NextResponse.json(
        { success: false, error: "That bedspace does not belong to this room" },
        { status: 400 }
      );
    }

    const { data: occupant } = await supabaseAdmin
      .from("students")
      .select("id, first_name, last_name")
      .eq("block", room.block)
      .eq("room", room.name)
      .eq("bedspace_label", bedspace_label)
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

    const reservations = parseBedReservations(room.bed_reservations);
    if (reservations.some((item) => item.bedspace_label === bedspace_label)) {
      return NextResponse.json(
        { success: false, error: "That bedspace is already reserved" },
        { status: 409 }
      );
    }

    reservations.push({
      bedspace_label,
      reserved_for_name,
      created_at: new Date().toISOString(),
    });

    const available_beds = (Array.isArray(room.available_beds)
      ? room.available_beds
      : []
    ).filter((bed: string) => bed !== bedspace_label);

    const { error } = await supabaseAdmin
      .from("rooms")
      .update({
        available_beds,
        bed_reservations: reservations,
      })
      .eq("id", id);

    if (error) {
      console.error("Reserve bedspace error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to reserve bedspace" },
        { status: 500 }
      );
    }

    const synced = await syncRoomAvailability(supabaseAdmin, id);
    return NextResponse.json({
      success: true,
      data: {
        room_id: id,
        bedspace_label,
        reserved_for_name,
        room_availability_status: synced?.status,
      },
    });
  } catch (error) {
    console.error("Reserve bedspace POST error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(ALLOWED_ROLES);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const bedspace_label =
      typeof body.bedspace_label === "string" ? body.bedspace_label.trim() : "";

    if (!bedspace_label) {
      return NextResponse.json(
        { success: false, error: "bedspace_label is required" },
        { status: 400 }
      );
    }

    const loaded = await loadRoom(id);
    if (!loaded.room) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.error?.includes("migration") ? 409 : 404 }
      );
    }

    const reservations = parseBedReservations(loaded.room.bed_reservations).filter(
      (item) => item.bedspace_label !== bedspace_label
    );

    const { error } = await supabaseAdmin
      .from("rooms")
      .update({ bed_reservations: reservations })
      .eq("id", id);

    if (error) {
      console.error("Cancel reservation error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to cancel reservation" },
        { status: 500 }
      );
    }

    const synced = await syncRoomAvailability(supabaseAdmin, id, {
      openIfFreed: true,
    });
    return NextResponse.json({
      success: true,
      data: {
        room_id: id,
        bedspace_label,
        room_availability_status: synced?.status,
      },
    });
  } catch (error) {
    console.error("Cancel reservation DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
