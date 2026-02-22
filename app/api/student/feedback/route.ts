import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAuthenticatedStudent } from "@/shared/server/student-auth";

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
    const message = String(body.message || "").trim();
    const rating = Number(body.rating || 0);

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Feedback message is required" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      student_id: authStudent.student.id,
      message,
    };

    if (rating >= 1 && rating <= 5) {
      payload.rating = rating;
    }

    const { data, error } = await supabaseAdmin
      .from("student_feedback")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Feedback table is missing. Please run the student-portal migration.",
          },
          { status: 500 }
        );
      }

      console.error("Create feedback error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to submit feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Feedback POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
