import { NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const STAFF_ROLES = ["super_admin", "admin", "porter", "other"];

export async function GET() {
  try {
    await requireRole(STAFF_ROLES);

    const { data, error } = await supabaseAdmin
      .from("student_support_tickets")
      .select(
        `
        id,
        title,
        description,
        category,
        priority,
        status,
        room_label,
        image_url,
        resolution_note,
        created_at,
        updated_at,
        student:students(id, first_name, last_name, matric_number, email, block, room),
        assigned_staff:admin_users!student_support_tickets_assigned_to_fkey(id, first_name, last_name, role)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Support tickets table is missing. Please run the student-portal migration.",
          },
          { status: 500 }
        );
      }

      console.error("Admin tickets fetch error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch student tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Admin tickets GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
