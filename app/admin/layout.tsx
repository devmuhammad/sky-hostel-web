import { ReactNode } from "react";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/features/dashboard/components/Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

async function getSession() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();
  
  // If no session, redirect to login (except for login page itself)
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Only show when authenticated */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
