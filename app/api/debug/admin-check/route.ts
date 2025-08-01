import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    const userInAuth = authUser.users.find(user => user.email === email);

    // Check if user exists in admin_users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        email,
        authUser: userInAuth ? {
          id: userInAuth.id,
          email: userInAuth.email,
          email_confirmed_at: userInAuth.email_confirmed_at,
          created_at: userInAuth.created_at,
        } : null,
        adminUser: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          first_name: adminUser.first_name,
          last_name: adminUser.last_name,
          role: adminUser.role,
          is_active: adminUser.is_active,
        } : null,
        authError: authError?.message,
        adminError: adminError?.message,
      },
    });
  } catch (error) {
    console.error("Debug admin check error:", error);
    return NextResponse.json(
      { success: false, error: "Debug check failed" },
      { status: 500 }
    );
  }
} 