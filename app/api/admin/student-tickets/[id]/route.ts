import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const STAFF_ROLES = ["super_admin", "admin", "porter", "other"];
const ALLOWED_STATUS = ["open", "in_progress", "resolved", "closed"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(STAFF_ROLES);
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, string | null> = {};

    if (typeof body.status === "string") {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (typeof body.resolution_note === "string") {
      updates.resolution_note = body.resolution_note.trim() || null;
    }

    if (updates.status === "in_progress" || updates.status === "resolved") {
      updates.assigned_to = currentUser.id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("student_support_tickets")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Admin ticket update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update ticket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Admin ticket PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
