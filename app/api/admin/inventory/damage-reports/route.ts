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

    const { data: reports, error } = await supabaseAdmin
      .from("inventory_damage_reports")
      .select(`
        *,
        item:inventory_items(name, category, room_id),
        reporter:admin_users(first_name, last_name, role)
      `)
      .order("created_at", { ascending: false });

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
    const { itemId, description, cost_estimate, image_url, responsible_student_id, status } = body;

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
