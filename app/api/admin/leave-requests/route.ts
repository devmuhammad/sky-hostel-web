import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const LEAVE_REQUEST_TABLES = ["staff_leave_requests", "leave_requests"] as const;

function isMissingTableError(error: any) {
  const message = String(error?.message || "");
  return message.includes("Could not find the table") || message.includes("relation") && message.includes("does not exist");
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole([
      "super_admin",
      "admin",
      "hostel_manager",
      "front_desk",
      "security",
      "maintenance",
      "porter",
      "cleaner",
      "accountant",
    ]);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!["super_admin", "admin", "hostel_manager"].includes(currentUser.role) && !userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId for staff" },
        { status: 400 }
      );
    }

    for (const tableName of LEAVE_REQUEST_TABLES) {
      let query = supabaseAdmin
        .from(tableName)
        .select(`
          *,
          staff:admin_users!staff_id(id, first_name, last_name, role),
          approver:admin_users!approved_by(id, first_name, last_name, role)
        `)
        .order("created_at", { ascending: false });

      if (!["super_admin", "admin", "hostel_manager"].includes(currentUser.role)) {
        query = query.eq("staff_id", userId!);
      }

      const { data: requests, error } = await query;
      if (!error) {
        return NextResponse.json({ success: true, data: requests });
      }

      if (!isMissingTableError(error)) {
        console.error("Error fetching leave requests:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: false, error: "Leave requests table is missing. Please run the leave-requests migration." },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([
      "super_admin",
      "admin",
      "hostel_manager",
      "front_desk",
      "security",
      "maintenance",
      "porter",
      "cleaner",
      "accountant",
    ]);

    const body = await request.json();
    const { staff_id, start_date, end_date, reason } = body;

    if (!staff_id || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = {
      staff_id,
      start_date,
      end_date,
      reason,
    };

    for (const tableName of LEAVE_REQUEST_TABLES) {
      const { data: request_record, error } = await supabaseAdmin
        .from(tableName)
        .insert([payload])
        .select()
        .single();

      if (!error) {
        return NextResponse.json({ success: true, data: request_record });
      }

      if (!isMissingTableError(error)) {
        console.error("Error creating leave request:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: false, error: "Leave requests table is missing. Please run the leave-requests migration." },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
