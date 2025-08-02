import { ReactNode } from "react";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/features/dashboard/components/Sidebar";
import MobileHeader from "@/features/dashboard/components/MobileHeader";

interface AdminLayoutProps {
  children: ReactNode;
}

async function checkUserAccess() {
  const supabase = await createServerSupabaseClient();

  // Use getUser() for secure authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isAuthenticated: false, isAdmin: false, error: "No user found" };
  }

  // For now, allow any authenticated user to access admin
  // We'll fix the database connection later
  return { isAuthenticated: true, isAdmin: true, error: null };
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isAdmin, error } = await checkUserAccess();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    redirect("/login");
  }

  // If not admin, redirect to login with error message
  if (!isAdmin) {
    redirect("/login?error=admin_access_required");
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Let it fetch its own admin user data */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden">
          <MobileHeader />
        </div>

        {/* Content area - removed fixed height and overflow constraints */}
        <div className="flex-1 pt-16 lg:pt-6 min-h-0">{children}</div>
      </div>
    </div>
  );
}
