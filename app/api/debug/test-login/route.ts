import { NextRequest, NextResponse } from "next/server";
import { createClientSupabaseClient } from "@/shared/config/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createClientSupabaseClient();

    // Step 1: Try to sign in
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return NextResponse.json({
        success: false,
        error: "Sign in failed",
        details: {
          message: signInError.message,
          status: signInError.status,
        },
      });
    }

    // Step 2: Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        signInSuccess: !!signInData.user,
        user: signInData.user
          ? {
              id: signInData.user.id,
              email: signInData.user.email,
            }
          : null,
        adminUser: adminUser
          ? {
              id: adminUser.id,
              email: adminUser.email,
              first_name: adminUser.first_name,
              last_name: adminUser.last_name,
              role: adminUser.role,
              is_active: adminUser.is_active,
            }
          : null,
        adminError: adminError?.message,
        session: signInData.session
          ? {
              access_token: signInData.session.access_token
                ? "present"
                : "missing",
              refresh_token: signInData.session.refresh_token
                ? "present"
                : "missing",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { success: false, error: "Test login failed" },
      { status: 500 }
    );
  }
}
