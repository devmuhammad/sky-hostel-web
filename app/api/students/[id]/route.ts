import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { message: "Student ID is required" } },
        { status: 400 }
      );
    }

    const supabaseAdmin = await createServerSupabaseClient();

    // Fetch student data
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        matric_number,
        course,
        level,
        faculty,
        department,
        block,
        room,
        bedspace_label,
        state_of_origin,
        passport_photo_url,
        created_at
      `
      )
      .eq("id", studentId)
      .single();

    if (studentError) {
      if (studentError.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: { message: "Student not found" } },
          { status: 404 }
        );
      }
      throw new Error("Failed to fetch student data");
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error: any) {
    console.error("Fetch student error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch student data" } },
      { status: 500 }
    );
  }
}
