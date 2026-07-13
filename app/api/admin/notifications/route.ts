import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAdminAccess();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    let query = supabaseAdmin
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;
    if (error) throw error;

    const { count: unreadCount, error: countError } = await supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id)
      .eq("is_read", false);

    if (countError) throw countError;

    return NextResponse.json({
      success: true,
      data: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch notifications" },
      { status: 401 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireAdminAccess();
    const body = await request.json().catch(() => ({}));

    let query = supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", currentUser.id);

    // If specific ids are provided, only mark those; otherwise mark all as read.
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      query = query.in("id", body.ids);
    } else {
      query = query.eq("is_read", false);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
