import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ALL_ROLES = ["super_admin", "admin", "porter", "other"] as const;
// Roles that an admin (non-super) is allowed to assign
const ADMIN_ASSIGNABLE_ROLES = ["porter", "other"] as const;
// Roles that only super_admin can manage (target user has one of these)
const PROTECTED_ROLES = ["super_admin", "admin"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentAdmin = await requireAdminAccess();
    const isSuperAdmin = currentAdmin.role === "super_admin";
    const isAdmin = currentAdmin.role === "admin";

    // Only super_admin or admin can perform edits
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Prevent modifying oneself
    if (id === currentAdmin.id) {
      return NextResponse.json(
        { success: false, error: "You cannot modify your own role or status" },
        { status: 400 }
      );
    }

    // Admins cannot modify users who already have a protected role (admin / super_admin)
    if (!isSuperAdmin) {
      const { data: targetUser } = await supabaseAdmin
        .from("admin_users")
        .select("role")
        .eq("id", id)
        .single();

      if (targetUser && PROTECTED_ROLES.includes(targetUser.role)) {
        return NextResponse.json(
          {
            success: false,
            error: "You do not have permission to modify Admin or Super Admin accounts.",
          },
          { status: 403 }
        );
      }
    }

    const { role, is_active } = await request.json();

    const updateData: { role?: string; is_active?: boolean } = {};

    if (role !== undefined) {
      if (!ALL_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid role. Allowed roles: ${ALL_ROLES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Admin cannot assign protected roles
      if (!isSuperAdmin && PROTECTED_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            error: "As an Admin, you can only assign Porter or Other roles.",
          },
          { status: 403 }
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
        { success: false, error: "Failed to update user" },
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
      { success: false, error: "Failed to update user" },
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
    const isSuperAdmin = currentAdmin.role === "super_admin";
    const isAdmin = currentAdmin.role === "admin";

    if (!isSuperAdmin && !isAdmin) {
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

    // Admins cannot delete users who have a protected role
    const { data: targetUser } = await supabaseAdmin
      .from("admin_users")
      .select("email, role")
      .eq("id", id)
      .single();

    if (!isSuperAdmin && targetUser && PROTECTED_ROLES.includes(targetUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete Admin or Super Admin accounts.",
        },
        { status: 403 }
      );
    }

    // Delete from public.admin_users table first
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
    if (targetUser?.email) {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authTarget = authUsers.users.find((u) => u.email === targetUser.email);
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
      metadata: { deleted_email: targetUser?.email },
    });

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete admin user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
