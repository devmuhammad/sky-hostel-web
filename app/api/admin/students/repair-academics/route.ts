import { NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { normalizeStudentAcademics } from "@/shared/constants/unilorin-academics";
import { fetchAllRows } from "@/shared/utils/supabase-fetch";

const ALLOWED_ROLES = ["super_admin", "admin"];

type StudentAcademicRow = {
  id: string;
  faculty: string | null;
  department: string | null;
  course: string | null;
};

export async function POST() {
  try {
    await requireRole(ALLOWED_ROLES);

    const students = await fetchAllRows<StudentAcademicRow>(
      supabaseAdmin,
      "students",
      "id, faculty, department, course"
    );

    let updated = 0;
    const samples: Array<{
      id: string;
      from: { faculty: string | null; department: string | null };
      to: { faculty: string; department: string };
    }> = [];

    for (const student of students) {
      const next = normalizeStudentAcademics(
        student.faculty,
        student.department,
        student.course
      );
      if (!next.changed) continue;

      const { error } = await supabaseAdmin
        .from("students")
        .update({
          faculty: next.faculty,
          department: next.department,
        })
        .eq("id", student.id);

      if (error) {
        console.error("Academic repair failed for", student.id, error);
        continue;
      }

      updated += 1;
      if (samples.length < 20) {
        samples.push({
          id: student.id,
          from: { faculty: student.faculty, department: student.department },
          to: { faculty: next.faculty, department: next.department },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scanned: students.length,
        updated,
        samples,
      },
    });
  } catch (error) {
    console.error("Repair academics error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
