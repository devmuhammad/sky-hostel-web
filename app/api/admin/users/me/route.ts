import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdminAccess();
    
    // Fetch full user details from admin_users table
    const { data: adminUser, error } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (error || !adminUser) {
      return NextResponse.json({ success: true, data: user }); // Fallback to auth payload
    }

    return NextResponse.json({ success: true, data: adminUser });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }
}
