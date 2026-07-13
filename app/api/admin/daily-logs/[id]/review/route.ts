import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { createNotification } from "@/shared/utils/notifications";

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

    // Notify the staff member who submitted the log about the review outcome.
    if (log?.staff_id && log.staff_id !== currentUser.id) {
      const statusLabel =
        supervisor_status === "approved"
          ? "approved"
          : supervisor_status === "requires_clarification"
            ? "flagged for clarification"
            : supervisor_status;
      await createNotification({
        userId: log.staff_id,
        type: "daily_log_review",
        title: `Your daily log was ${statusLabel}`,
        message: supervisor_comments || undefined,
        link: "/admin/daily-logs",
        relatedId: id,
      });
    }

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Update daily log status error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to update log" },
      { status: 500 }
    );
  }
}
