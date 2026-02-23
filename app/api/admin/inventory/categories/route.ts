import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const STAFF_ROLES = ["admin", "super_admin", "hostel_manager", "maintenance", "porter", "other"];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(STAFF_ROLES);

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    const { data: categories, error } = await supabaseAdmin
      .from("inventory_categories")
      .select("id, name, slug, is_room_template, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    if (!roomId) {
      return NextResponse.json({ success: true, data: { categories: categories || [], roomTemplates: [] } });
    }

    const { data: roomTemplates, error: templatesError } = await supabaseAdmin
      .from("room_inventory_category_templates")
      .select(
        `
        id,
        room_id,
        expected_quantity,
        category:inventory_categories(id, name, slug, is_room_template, is_active)
      `
      )
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (templatesError) throw templatesError;

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        roomTemplates: roomTemplates || [],
      },
    });
  } catch (error) {
    console.error("Inventory categories GET error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to load inventory categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireRole(STAFF_ROLES);
    const body = await request.json();

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const slug = toSlug(body.slug || name);
    if (!slug) {
      return NextResponse.json({ success: false, error: "Category slug is invalid" }, { status: 400 });
    }

    const payload = {
      name,
      slug,
      is_room_template: Boolean(body.is_room_template),
      is_active: body.is_active ?? true,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
      created_by: currentUser.id,
    };

    const { data: category, error } = await supabaseAdmin
      .from("inventory_categories")
      .insert(payload)
      .select("id, name, slug, is_room_template, is_active, sort_order")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: false, error: "Category with this name or slug already exists" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Inventory categories POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inventory category" },
      { status: 500 }
    );
  }
}
