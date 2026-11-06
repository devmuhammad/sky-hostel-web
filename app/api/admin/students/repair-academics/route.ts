import { NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { normalizeStudentAcademics } from "@/shared/constants/unilorin-academics";
import { fetchAllRows } from "@/shared/utils/supabase-fetch";

export const maxDuration = 60;

const ALLOWED_ROLES = ["super_admin", "admin"];
const UPDATE_CONCURRENCY = 15;

type StudentAcademicRow = {
  id: string;
  faculty: string | null;
  department: string | null;
  course: string | null;
};

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export async function POST() {
  try {
    await requireRole(ALLOWED_ROLES);

    const students = await fetchAllRows<StudentAcademicRow>(
      supabaseAdmin,
      "students",
      "id, faculty, department, course"
    );

    const pending = students
      .map((student) => {
        const next = normalizeStudentAcademics(
          student.faculty,
          student.department,
          student.course
        );
        if (!next.changed) return null;
        return { student, next };
      })
      .filter(
        (
          item
        ): item is {
          student: StudentAcademicRow;
          next: ReturnType<typeof normalizeStudentAcademics>;
        } => Boolean(item)
      );

    let updated = 0;
    const samples: Array<{
      id: string;
      from: { faculty: string | null; department: string | null };
      to: { faculty: string; department: string };
    }> = [];

    await mapWithConcurrency(pending, UPDATE_CONCURRENCY, async ({ student, next }) => {
      const { error } = await supabaseAdmin
        .from("students")
        .update({
          faculty: next.faculty,
          department: next.department,
        })
        .eq("id", student.id);

      if (error) {
        console.error("Academic repair failed for", student.id, error);
        return;
      }

      updated += 1;
      if (samples.length < 20) {
        samples.push({
          id: student.id,
          from: { faculty: student.faculty, department: student.department },
          to: { faculty: next.faculty, department: next.department },
        });
      }
    });

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
