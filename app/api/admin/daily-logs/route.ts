import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole([
      "admin",
      "super_admin",
      "hostel_manager",
      "front_desk",
      "security",
      "accountant",
      "maintenance",
      "porter",
      "cleaner",
    ]);

    const url = new URL(request.url);
    const filterUserId = url.searchParams.get('userId');

    let query = supabaseAdmin
      .from("staff_daily_logs")
      .select(`
        *,
        staff:admin_users!staff_daily_logs_staff_id_fkey(first_name, last_name, role),
        supervisor:admin_users!staff_daily_logs_supervisor_id_fkey(first_name, last_name, role)
      `)
      .order("created_at", { ascending: false });

    // Supervisors/Admins can see everything. Normal staff only see theirs, unless querying explicitly to fetch all.
    // The policy on RLS would technically handle this if using standard client, but we're on supabaseAdmin.
    // Let's enforce it in the API logic.
    const isSupervisor = ["super_admin", "admin", "hostel_manager"].includes(currentUser.role);
    
    if (!isSupervisor) {
      query = query.eq("staff_id", currentUser.id);
    } else if (filterUserId) {
      query = query.eq("staff_id", filterUserId);
    }

    const { data: logs, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Fetch daily logs error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole([
      "front_desk",
      "security",
      "accountant",
      "maintenance",
      "porter",
      "cleaner",
      "admin",
      "super_admin",
      "hostel_manager"
    ]);

    const body = await request.json();
    const { log_date, shift, duty_type, activities, issues_observed, materials_used } = body;

    if (!shift || !duty_type || !activities) {
      return NextResponse.json(
        { success: false, error: "Shift, duty type, and activities are required" },
        { status: 400 }
      );
    }

    const { data: log, error } = await supabaseAdmin
      .from("staff_daily_logs")
      .insert({
        staff_id: currentUser.id,
        log_date: log_date || new Date().toISOString().split('T')[0],
        shift,
        duty_type,
        activities,
        issues_observed,
        materials_used,
        supervisor_status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error("Create daily log error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create daily log" },
      { status: 500 }
    );
  }
}
