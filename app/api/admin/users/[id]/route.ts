import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ALLOWED_ADMIN_ROLES = ["super_admin", "admin", "porter", "other"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentAdmin = await requireAdminAccess();

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { role, is_active } = await request.json();

    // Prevent modifying oneself
    if (id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "You cannot modify your own role or status" },
        { status: 400 }
      );
    }

    const updateData: { role?: string; is_active?: boolean } = {};
    if (role !== undefined) {
      if (!ALLOWED_ADMIN_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid role. Allowed roles: ${ALLOWED_ADMIN_ROLES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updateData.role = role;
    }
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedAdmin, error } = await supabaseAdmin
      .from("admin_users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating admin user:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update admin user" },
        { status: 500 }
      );
    }

    // Log activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "admin_user_updated",
      resource_type: "admin_user",
      resource_id: id,
      admin_user_id: currentAdmin.id,
      metadata: { updates: updateData },
    });

    return NextResponse.json({ success: true, data: updatedAdmin });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentAdmin = await requireAdminAccess();

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prevent deleting oneself
    if (id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Optional: Get the user's email first to delete from Auth
    const { data: adminUser } = await supabaseAdmin
      .from("admin_users")
      .select("email")
      .eq("id", id)
      .single();

    // Delete from public.admin_users table First
    const { error: dbError } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Error deleting admin user from DB:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to delete from database" },
        { status: 500 }
      );
    }

    // Delete from Supabase Auth if found
    if (adminUser?.email) {
      // Look up Auth user by email or if you stored auth_id, use that.
      // Easiest is to keep it in Database, or rely on admin_users table for auth validation.
      // We will try to fetch the auth user and delete it.
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authTarget = authUsers.users.find((u) => u.email === adminUser.email);
      if (authTarget) {
        await supabaseAdmin.auth.admin.deleteUser(authTarget.id);
      }
    }

    // Log the deletion
    await supabaseAdmin.from("activity_logs").insert({
      action: "admin_user_deleted",
      resource_type: "admin_user",
      resource_id: id,
      admin_user_id: currentAdmin.id,
      metadata: { deleted_email: adminUser?.email },
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete admin user" },
      { status: 500 }
    );
  }
}
