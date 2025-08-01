import { ReactNode } from "react";
import {
  createServerSupabaseClient,
  checkAdminAccess,
} from "@/shared/config/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/features/dashboard/components/Sidebar";
import { DashboardLoadingProvider } from "@/shared/components/ui/dashboard-loading";

interface AdminLayoutProps {
  children: ReactNode;
}

async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  // If no session, redirect to login
  if (!session) {
    redirect("/login");
  }

  // Check if user has admin access
  const { isAdmin, adminUser, error } = await checkAdminAccess();

  if (!isAdmin) {
    // Redirect to login with error message
    redirect("/login?error=admin_access_required");
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - Only show when authenticated */}
      <Sidebar adminUser={adminUser} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Add top padding to account for fixed header */}
        <div className="pt-20 h-full overflow-y-auto">
          <DashboardLoadingProvider>
            {children}
          </DashboardLoadingProvider>
        </div>
      </div>
    </div>
  );
}
