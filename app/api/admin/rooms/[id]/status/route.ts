import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { syncRoomAvailability } from "@/shared/utils/room-availability";

const ALLOWED_ROLES = ["super_admin", "admin", "hostel_manager", "porter", "other"];
const ALLOWED_STATUS = ["open", "locked"] as const;

type RoomAvailabilityStatus = (typeof ALLOWED_STATUS)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(ALLOWED_ROLES);

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "") as RoomAvailabilityStatus;

    if (String(body.status || "") === "reserved") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reserve a specific bedspace and the person's name instead of marking the whole room reserved",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid room status" },
        { status: 400 }
      );
    }

    const { data: room, error } = await supabaseAdmin
      .from("rooms")
      .update({ room_availability_status: status })
      .eq("id", id)
      .select("id, name, block, available_beds, room_availability_status")
      .single();

    if (error) {
      console.error("Room status update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update room status" },
        { status: 500 }
      );
    }

    const synced = await syncRoomAvailability(supabaseAdmin, id, {
      openIfFreed: status === "open",
    });

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        room_availability_status:
          synced?.status || room.room_availability_status,
        available_beds: synced?.available_beds || room.available_beds,
      },
    });
  } catch (error) {
    console.error("Room status PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
