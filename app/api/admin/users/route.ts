import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  requireAdminAccess,
} from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    // Check if current user is super admin
    const currentAdmin = await requireAdminAccess();

    if (currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role = "admin",
    } = await request.json();

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

    // Check if admin user already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin user with this email already exists" },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        { success: false, error: "Failed to create user account" },
        { status: 500 }
      );
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
      // Clean up the auth user if admin creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { success: false, error: "Failed to create admin user" },
        { status: 500 }
      );
    }

    // Log the admin creation
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
        message: "Admin user created successfully",
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
      { success: false, error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if current user is admin
    const currentAdmin = await requireAdminAccess();

    if (currentAdmin.role !== "super_admin") {
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
