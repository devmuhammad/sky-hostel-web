import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

// Public endpoint — the registration/invoice pages and payment flow all
// need to read this without being logged in.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "registration_open")
      .single();

    // If the row doesn't exist yet (e.g. migration not applied), fail open
    // so we never accidentally lock out real applicants.
    if (error || !data) {
      return NextResponse.json({ success: true, data: { isOpen: true } });
    }

    return NextResponse.json({
      success: true,
      data: { isOpen: data.value === true },
    });
  } catch (error) {
    console.error("Registration status fetch error:", error);
    return NextResponse.json({ success: true, data: { isOpen: true } });
  }
}
