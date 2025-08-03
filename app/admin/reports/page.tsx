import { Suspense } from "react";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { redirect } from "next/navigation";

async function checkSuperAdminAccess() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isSuperAdmin: false, error: "No user found" };
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (!adminUser || adminUser.role !== "super_admin") {
    return { isSuperAdmin: false, error: "Super admin access required" };
  }

  return { isSuperAdmin: true, error: null };
}

async function ReportsAnalytics() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Reports & Analytics
        </h3>
        <p className="text-gray-600">
          Comprehensive reports and analytics for super administrators.
        </p>
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  const { isSuperAdmin, error } = await checkSuperAdminAccess();

  // If not super admin, redirect to dashboard
  if (!isSuperAdmin) {
    redirect("/admin");
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive reports and analytics for hostel management.
          </p>
        </div>

        <Suspense fallback={<div>Loading reports...</div>}>
          <ReportsAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
