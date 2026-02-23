import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const STAFF_ROLES = ["admin", "super_admin", "hostel_manager", "maintenance", "porter", "other"];

export async function GET(request: NextRequest) {
  try {
    await requireRole(STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ success: false, error: "roomId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("room_inventory_category_templates")
      .select(
        `
        id,
        room_id,
        expected_quantity,
        created_at,
        category:inventory_categories(id, name, slug, is_room_template, is_active)
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("Room categories GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load room categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(STAFF_ROLES);
    const body = await request.json();

    const room_id = String(body.room_id || "").trim();
    const category_id = String(body.category_id || "").trim();
    const expected_quantity = Number(body.expected_quantity || 1);

    if (!room_id || !category_id) {
      return NextResponse.json({ success: false, error: "room_id and category_id are required" }, { status: 400 });
    }

    if (!Number.isFinite(expected_quantity) || expected_quantity <= 0) {
      return NextResponse.json({ success: false, error: "expected_quantity must be greater than 0" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("room_inventory_category_templates")
      .upsert(
        {
          room_id,
          category_id,
          expected_quantity,
          created_by: currentUser.id,
        },
        { onConflict: "room_id,category_id" }
      )
      .select(
        `
        id,
        room_id,
        expected_quantity,
        created_at,
        category:inventory_categories(id, name, slug, is_room_template, is_active)
      `
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Room categories POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to attach category to room" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "templateId is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("room_inventory_category_templates")
      .delete()
      .eq("id", templateId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Room categories DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to remove room category" }, { status: 500 });
  }
}
