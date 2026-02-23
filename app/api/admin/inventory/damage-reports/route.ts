import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    // Only certain staff can manage inventory and view all reports centrally
    await requireRole([
      "admin",
      "super_admin",
      "hostel_manager",
      "maintenance",
      "porter",
      "cleaner",
    ]);

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    let itemIds: string[] | null = null;

    if (roomId) {
      const { data: roomItems, error: roomItemsError } = await supabaseAdmin
        .from("inventory_items")
        .select("id")
        .eq("room_id", roomId);

      if (roomItemsError) throw roomItemsError;
      itemIds = (roomItems || []).map((item) => item.id);

      if (itemIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    let query = supabaseAdmin
      .from("inventory_damage_reports")
      .select(`
        *,
        item:inventory_items(id, name, category, category_id, room_id),
        reporter:admin_users(first_name, last_name, role),
        handled_staff:admin_users!inventory_damage_reports_handled_by_fkey(first_name, last_name, role)
      `)
      .order("created_at", { ascending: false });

    if (itemIds) {
      query = query.in("item_id", itemIds);
    }

    const { data: reports, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: reports });
  } catch (error) {
    console.error("Fetch damage reports error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole([
      "admin",
      "super_admin",
      "hostel_manager",
      "maintenance",
      "porter",
      "cleaner",
      "front_desk",
      "security",
    ]);

    const body = await request.json();
    const { itemId, description, cost_estimate, image_url, responsible_student_id, status, action_taken } = body;

    if (!itemId || !description) {
      return NextResponse.json(
        { success: false, error: "Item ID and description are required" },
        { status: 400 }
      );
    }

    // Insert Damage Report
    const { data: report, error } = await supabaseAdmin
      .from("inventory_damage_reports")
      .insert({
        item_id: itemId,
        reporter_id: currentUser.id,
        description,
        cost_estimate: cost_estimate ? parseFloat(cost_estimate) : null,
        image_url,
        responsible_student_id: responsible_student_id || null,
        status: status || "unresolved",
        action_taken: action_taken ? String(action_taken).trim() : null,
        handled_by: currentUser.id,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: If status is reported, change item condition to needs_repair temporarily
    await supabaseAdmin
      .from("inventory_items")
      .update({ condition: "needs_repair" })
      .eq("id", itemId);

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Create damage report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create damage report" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireRole([
      "admin",
      "super_admin",
      "hostel_manager",
      "maintenance",
      "porter",
      "cleaner",
      "front_desk",
      "security",
    ]);

    const body = await request.json();
    const reportId = String(body.reportId || "").trim();

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "reportId is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      handled_by: currentUser.id,
    };

    if (typeof body.status === "string") {
      updates.status = body.status;
      updates.resolved_at = body.status === "resolved" ? new Date().toISOString() : null;
    }

    if (typeof body.action_taken === "string") {
      updates.action_taken = body.action_taken.trim() || null;
    }

    if (body.cost_estimate !== undefined) {
      updates.cost_estimate = body.cost_estimate ? Number(body.cost_estimate) : null;
    }

    const { data: report, error: reportError } = await supabaseAdmin
      .from("inventory_damage_reports")
      .update(updates)
      .eq("id", reportId)
      .select("id, item_id, status")
      .single();

    if (reportError) throw reportError;

    if (report?.item_id && typeof report.status === "string") {
      const nextCondition =
        report.status === "resolved" ? "good" : report.status === "in_progress" ? "needs_repair" : "needs_repair";

      await supabaseAdmin
        .from("inventory_items")
        .update({ condition: nextCondition })
        .eq("id", report.item_id);
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Update damage report error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update repair action progress" },
      { status: 500 }
    );
  }
}
