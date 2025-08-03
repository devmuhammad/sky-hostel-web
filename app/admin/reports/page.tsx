import { Suspense } from "react";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { redirect } from "next/navigation";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import ReportsAnalytics from "./ReportsAnalytics";

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

export default async function ReportsPage() {
  const { isSuperAdmin, error } = await checkSuperAdminAccess();

  // If not super admin, redirect to dashboard
  if (!isSuperAdmin) {
    redirect("/admin");
  }

  return (
    <div className="p-4 lg:p-6 pb-8 lg:pb-12">
      <div className="mx-auto space-y-4 lg:space-y-6">
        <Suspense fallback={<CardLoadingSkeleton cards={4} />}>
          <ReportsAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
