import { createServerSupabaseClient } from "@/shared/config/auth";
import { isStudentBlocked } from "@/shared/utils/student-eligibility";

export interface AuthenticatedStudent {
  userId: string;
  email: string;
  student: any;
}

export async function getAuthenticatedStudent(): Promise<AuthenticatedStudent | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return null;
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("*")
    .ilike("email", user.email)
    .single();

  if (studentError || !student) {
    return null;
  }

  if (isStudentBlocked(student)) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    student,
  };
}
