import { NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { reconcileAllRoomAvailability } from "@/shared/utils/room-availability";

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "hostel_manager",
  "porter",
  "other",
];

export async function POST() {
  try {
    await requireRole(ALLOWED_ROLES);
    const result = await reconcileAllRoomAvailability(supabaseAdmin);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Room availability reconcile error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
