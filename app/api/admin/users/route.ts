import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  requireAdminAccess,
} from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ALL_ROLES = ["super_admin", "admin", "porter", "other"] as const;
// Roles that admin (non-super) can assign
const ADMIN_ASSIGNABLE_ROLES = ["porter", "other"] as const;

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await requireAdminAccess();
    const isSuperAdmin = currentAdmin.role === "super_admin";
    const isAdmin = currentAdmin.role === "admin";

    // Only super_admin or admin can create users
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const {
      email: rawEmail,
      password,
      firstName,
      lastName,
      role = isSuperAdmin ? "admin" : "porter",
    } = await request.json();
    const email = rawEmail?.trim().toLowerCase();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 8 characters long",
        },
        { status: 400 }
      );
    }

    // Validate role — admin can only assign porter or other
    if (!ALL_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid role. Allowed roles: ${ALL_ROLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!isSuperAdmin && !ADMIN_ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "As an Admin, you can only create Porter or Other staff accounts.",
        },
        { status: 403 }
      );
    }

    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth (or reuse existing auth user)
    let authUserId: string;
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      // If auth user already exists, find them and reuse their ID
      if (authError.code === "email_exists") {
        const { data: existingAuthUsers } =
          await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = existingAuthUsers?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (existingAuthUser) {
          // Update the password for the existing auth user
          await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, { password });
          authUserId = existingAuthUser.id;
        } else {
          // Auth user exists but couldn't be located — proceed anyway
          authUserId = "";
        }
      } else {
        console.error("Auth user creation error:", authError);
        return NextResponse.json(
          { success: false, error: authError.message || "Failed to create user account" },
          { status: 500 }
        );
      }
    } else {
      authUserId = authUser.user.id;
    }

    // Create admin user record
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (adminError) {
      console.error("Admin user creation error:", adminError);
      // Clean up the auth user if admin creation fails (only if we created it)
      if (authUserId) await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { success: false, error: adminError.message || "Failed to create user" },
        { status: 500 }
      );
    }

    // Log the creation
    await supabaseAdmin.from("activity_logs").insert({
      action: "admin_user_created",
      resource_type: "admin_user",
      resource_id: adminUser.id,
      admin_user_id: currentAdmin.id,
      metadata: {
        email,
        role,
        created_by: currentAdmin.email,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "User created successfully",
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.first_name,
          lastName: adminUser.last_name,
          role: adminUser.role,
        },
      },
    });
  } catch (error) {
    console.error("Create admin user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentAdmin = await requireAdminAccess();

    if (!["super_admin", "admin"].includes(currentAdmin.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: adminUsers, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch admin users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: adminUsers || [],
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}
