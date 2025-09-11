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

  // Check if user exists in admin_users table
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (adminError || !adminUser) {
    return {
      isAuthenticated: true,
      isAdmin: false,
      error: "Not an admin user",
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: true,
    adminRole: adminUser.role,
    error: null,
  };
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
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar - Let it fetch its own admin user data */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header - Only visible on mobile */}
        <div className="lg:hidden">
          <MobileHeader />
        </div>

        {/* Content area - proper spacing for mobile header and scrollable content */}
        <div className="flex-1 pt-20 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
