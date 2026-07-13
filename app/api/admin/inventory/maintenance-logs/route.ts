import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const MANAGE_ROLES = [
  "super_admin",
  "admin",
  "hostel_manager",
  "maintenance",
  "porter",
  "other",
];

const VIEW_ROLES = [
  ...MANAGE_ROLES,
  "front_desk",
  "security",
  "cleaner",
  "accountant",
];

const ALLOWED_STATUS = ["pending", "in_progress", "completed"];

export async function GET(request: NextRequest) {
  try {
    await requireRole(VIEW_ROLES);

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    let query = supabaseAdmin
      .from("room_maintenance_logs")
      .select(`
        *,
        room:rooms(name, block),
        creator:admin_users(first_name, last_name, role)
      `)
      .order("check_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Fetch maintenance logs error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch maintenance logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(MANAGE_ROLES);
    const body = await request.json();

    const roomId = String(body.room_id || "").trim();
    const issueFound = String(body.issue_found || "").trim();

    if (!roomId || !issueFound) {
      return NextResponse.json(
        { success: false, error: "Room and issue found are required" },
        { status: 400 }
      );
    }

    const status = ALLOWED_STATUS.includes(body.status) ? body.status : "pending";

    const { data, error } = await supabaseAdmin
      .from("room_maintenance_logs")
      .insert({
        room_id: roomId,
        check_date: body.check_date || new Date().toISOString().split("T")[0],
        issue_found: issueFound,
        action_taken: body.action_taken ? String(body.action_taken).trim() || null : null,
        status,
        officer_responsible: body.officer_responsible
          ? String(body.officer_responsible).trim() || null
          : `${currentUser.first_name} ${currentUser.last_name}`.trim(),
        complaint_url: body.complaint_url ? String(body.complaint_url).trim() || null : null,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Create maintenance log error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create maintenance log" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(MANAGE_ROLES);
    const body = await request.json();

    const logId = String(body.id || body.logId || "").trim();
    if (!logId) {
      return NextResponse.json(
        { success: false, error: "Log id is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.status === "string") {
      if (!ALLOWED_STATUS.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.action_taken !== undefined) {
      updates.action_taken = body.action_taken ? String(body.action_taken).trim() || null : null;
    }
    if (body.issue_found !== undefined && String(body.issue_found).trim()) {
      updates.issue_found = String(body.issue_found).trim();
    }
    if (body.officer_responsible !== undefined) {
      updates.officer_responsible = body.officer_responsible ? String(body.officer_responsible).trim() || null : null;
    }
    if (body.complaint_url !== undefined) {
      updates.complaint_url = body.complaint_url ? String(body.complaint_url).trim() || null : null;
    }
    if (body.check_date !== undefined && body.check_date) {
      updates.check_date = body.check_date;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("room_maintenance_logs")
      .update(updates)
      .eq("id", logId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Update maintenance log error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update maintenance log" },
      { status: 500 }
    );
  }
}
