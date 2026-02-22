import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAuthenticatedStudent } from "@/shared/server/student-auth";

export async function GET() {
  try {
    const authStudent = await getAuthenticatedStudent();

    if (!authStudent) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

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
        assigned_staff:admin_users!student_support_tickets_assigned_to_fkey(first_name, last_name, role)
      `
      )
      .eq("student_id", authStudent.student.id)
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

      console.error("Fetch student tickets error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch tickets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Student tickets GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authStudent = await getAuthenticatedStudent();

    if (!authStudent) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const category = String(body.category || "general").trim();
    const priority = String(body.priority || "medium").trim();
    const roomLabel = String(body.room_label || "").trim();
    const imageUrl = body.image_url ? String(body.image_url).trim() : null;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("student_support_tickets")
      .insert({
        student_id: authStudent.student.id,
        title,
        description,
        category,
        priority,
        room_label: roomLabel || `${authStudent.student.block}${authStudent.student.room}`,
        image_url: imageUrl || null,
        status: "open",
      })
      .select("*")
      .single();

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

      console.error("Create student ticket error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create ticket" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Student tickets POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
