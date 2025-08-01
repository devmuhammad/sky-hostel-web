import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Testing login for:", email);

    const supabase = await createServerSupabaseClient();

    // Test 1: Basic sign in
    console.log("Attempting sign in...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("Sign in result:", { data: !!data, error: error?.message });

    if (error) {
      return NextResponse.json({
        success: false,
        error: "Sign in failed",
        message: error.message,
        status: error.status,
      });
    }

    if (!data.user) {
      return NextResponse.json({
        success: false,
        error: "No user returned",
      });
    }

    // Test 2: Check admin table (this might fail due to RLS)
    console.log("Checking admin table...");
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    console.log("Admin check result:", {
      data: !!adminData,
      error: adminError?.message,
    });

    return NextResponse.json({
      success: true,
      authSuccess: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      adminCheck: {
        success: !adminError,
        data: adminData,
        error: adminError?.message,
      },
    });
  } catch (error) {
    console.error("Simple login error:", error);
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
