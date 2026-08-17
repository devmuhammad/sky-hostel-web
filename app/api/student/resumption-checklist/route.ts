import { NextResponse } from "next/server";
import { getAuthenticatedStudent } from "@/shared/server/student-auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { RESUMPTION_SESSION } from "@/shared/constants/resumption-documents";
import { getResumptionChecklistBundle } from "@/shared/utils/resumption-verification";

export async function GET() {
  try {
    const authStudent = await getAuthenticatedStudent();

    if (!authStudent) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const bundle = await getResumptionChecklistBundle(
        supabaseAdmin,
        authStudent.student.id,
        RESUMPTION_SESSION
      );

      return NextResponse.json({
        success: true,
        data: {
          session_label: RESUMPTION_SESSION,
          room: {
            block: authStudent.student.block,
            room: authStudent.student.room,
            bedspace_label: authStudent.student.bedspace_label,
          },
          ...bundle,
        },
      });
    } catch (error: any) {
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Resumption checklist is not available yet. Please contact the hostel office.",
          },
          { status: 503 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Student resumption checklist GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load resumption checklist" },
      { status: 500 }
    );
  }
}
