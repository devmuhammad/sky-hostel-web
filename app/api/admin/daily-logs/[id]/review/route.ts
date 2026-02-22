import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Only supervisors can review logs
    const currentUser = await requireRole([
      "admin",
      "super_admin",
      "hostel_manager"
    ]);

    const body = await request.json();
    const { supervisor_status, supervisor_comments } = body;

    if (!supervisor_status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabaseAdmin
      .from("staff_daily_logs")
      .update({
        supervisor_status,
        supervisor_comments,
        supervisor_id: currentUser.id
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Update daily log status error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to update log" },
      { status: 500 }
    );
  }
}
