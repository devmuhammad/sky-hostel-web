import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getActiveSessionConfig } from "@/shared/utils/active-session";

/**
 * Public read of the active academic session (label + fee).
 * Used by registration / invoice UI.
 */
export async function GET() {
  try {
    const session = await getActiveSessionConfig(supabaseAdmin);
    return NextResponse.json({
      success: true,
      data: {
        label: session.label,
        feeAmount: session.feeAmount,
        source: session.source,
      },
    });
  } catch (error) {
    console.error("Public session settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load session" },
      { status: 500 }
    );
  }
}
