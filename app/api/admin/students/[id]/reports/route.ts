import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Require active staff to view
    await requireRole([
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

    const { data: reports, error } = await supabaseAdmin
      .from("student_reports")
      .select(`
        *,
        reporter:admin_users(first_name, last_name, role)
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to get reports" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Any active staff can create reports
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

    const body = await request.json();
    const { category, severity, title, comments, evidence_url, status } = body;

    if (!category || !severity || !title) {
      return NextResponse.json(
        { success: false, error: "Category, severity, and title are required" },
        { status: 400 }
      );
    }

    const { data: report, error } = await supabaseAdmin
      .from("student_reports")
      .insert({
        student_id: id,
        reporter_id: currentUser.id,
        category,
        severity,
        title,
        comments,
        evidence_url,
        status: status || "unresolved",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating report:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create report" },
        { status: 500 }
      );
    }

    // Auto-flagging logic: Count penalty-style reports
    const { count, error: countError } = await supabaseAdmin
      .from("student_reports")
      .select("*", { count: "exact", head: true })
      .eq("student_id", id)
      .in("category", ["warning", "misconduct", "disturbance", "damage"]);

    if (!countError && count !== null) {
      let newStatus = "good";
      if (count >= 3) {
        newStatus = "flagged";
      } else if (count >= 1) {
        newStatus = "warning";
      }

      await supabaseAdmin
        .from("students")
        .update({ behaviour_status: newStatus })
        .eq("id", id);
    }

    // Audit log
    await supabaseAdmin.from("activity_logs").insert({
      action: "student_report_created",
      resource_type: "student_report",
      resource_id: report.id,
      admin_user_id: currentUser.id,
      metadata: {
        student_id: id,
        title,
        category,
        severity,
        status: status || "unresolved",
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create report" },
      { status: 500 }
    );
  }
}
