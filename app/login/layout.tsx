import {
  createServerSupabaseClient,
  checkAdminAccess,
} from "@/shared/config/auth";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is already authenticated, check if they're an admin
  if (session) {
    const { isAdmin } = await checkAdminAccess();
    if (isAdmin) {
      redirect("/admin");
    } else {
      // If authenticated but not admin, sign them out and show login
      await supabase.auth.signOut();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className=" w-full space-y-8">{children}</div>
    </div>
  );
}
