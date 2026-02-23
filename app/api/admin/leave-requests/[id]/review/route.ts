import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const LEAVE_REQUEST_TABLES = ["staff_leave_requests", "leave_requests"] as const;

function isMissingTableError(error: any) {
  const message = String(error?.message || "");
  return message.includes("Could not find the table") || message.includes("relation") && message.includes("does not exist");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireRole([
      "super_admin",
      "admin",
      "hostel_manager",
    ]);

    const body = await request.json();
    const { status, approved_by, rejection_reason } = body;

    if (!status || !approved_by) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updateData: any = {
      status,
      approved_by,
      updated_at: new Date().toISOString()
    };

    if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    for (const tableName of LEAVE_REQUEST_TABLES) {
      const { data: request_record, error } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (!error) {
        return NextResponse.json({ success: true, data: request_record });
      }

      if (!isMissingTableError(error)) {
        console.error("Error updating leave request:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      { error: "Leave requests table is missing. Please run the leave-requests migration." },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
