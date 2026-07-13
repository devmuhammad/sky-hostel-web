import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const SETTING_KEY = "complaint_form_url";

export async function GET() {
  try {
    // Any authenticated staff member may read the complaint form link.
    await requireAdminAccess();

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", SETTING_KEY)
      .maybeSingle();

    if (error) throw error;

    const url = typeof data?.value === "string" ? data.value : "";
    return NextResponse.json({ success: true, data: { url } });
  } catch (error) {
    console.error("Fetch complaint form url error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch setting" },
      { status: 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentAdmin = await requireRole(["super_admin", "admin", "hostel_manager"]);
    const body = await request.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .upsert({
        key: SETTING_KEY,
        value: url,
        updated_by: currentAdmin.id,
        updated_at: new Date().toISOString(),
      })
      .select("value")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { url: typeof data.value === "string" ? data.value : "" },
    });
  } catch (error) {
    console.error("Update complaint form url error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to update setting" },
      { status: 401 }
    );
  }
}
