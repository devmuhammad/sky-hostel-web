import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedStudent } from "@/shared/server/student-auth";
import StudentSignOutButton from "../StudentSignOutButton";
import { createServerSupabaseClient } from "@/shared/config/auth";

export default async function ProtectedStudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authStudent = await getAuthenticatedStudent();

  if (!authStudent) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      redirect("/student/login?error=student_profile_not_found");
    }

    redirect("/student/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div>
            <p className="text-sm text-slate-500">Student Portal</p>
            <h1 className="text-base font-semibold text-slate-900">
              {authStudent.student.first_name} {authStudent.student.last_name}
            </h1>
          </div>
          <StudentSignOutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4 md:p-6">{children}</main>
    </div>
  );
}
