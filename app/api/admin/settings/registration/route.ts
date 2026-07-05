import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ALLOWED_ROLES = ["super_admin", "admin"];

export async function PATCH(request: NextRequest) {
  try {
    const currentAdmin = await requireRole(ALLOWED_ROLES);

    const body = await request.json();
    const isOpen = body?.isOpen;

    if (typeof isOpen !== "boolean") {
      return NextResponse.json(
        { success: false, error: "isOpen must be true or false" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: "registration_open",
        value: isOpen,
        updated_by: currentAdmin.id,
        updated_at: new Date().toISOString(),
      })
      .select("value")
      .single();

    if (error) {
      console.error("Registration toggle error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update registration status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { isOpen: data.value === true },
    });
  } catch (error) {
    console.error("Registration toggle PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
