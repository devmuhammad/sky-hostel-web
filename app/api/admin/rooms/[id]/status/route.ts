import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ALLOWED_ROLES = ["super_admin", "admin", "hostel_manager", "porter", "other"];
const ALLOWED_STATUS = ["open", "reserved", "locked"] as const;

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
      .select("id, name, block, room_availability_status")
      .single();

    if (error) {
      console.error("Room status update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update room status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error("Room status PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
