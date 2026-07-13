import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

const ITEM_STATUS_VALUES = ["good", "damaged", "missing", "under_maintenance"] as const;

function normalizeItemStatus(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return (ITEM_STATUS_VALUES as readonly string[]).includes(normalized) ? normalized : null;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole([
      "admin",
      "super_admin",
      "porter",
      "other",
    ]);

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    let query = supabaseAdmin
      .from("inventory_items")
      .select(`
        *,
        category_ref:inventory_categories(id, name, slug),
        room:rooms(name, block),
        assigned_student:students(first_name, last_name, matric_number)
      `)
      .order("created_at", { ascending: false });

    if (roomId) {
      query = query.eq("room_id", roomId);
    }

    const { data: items, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Fetch inventory error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([
      "admin",
      "super_admin",
      "porter",
      "other",
    ]);

    const body = await request.json();
    const {
      name,
      category,
      category_id,
      room_id,
      condition,
      price_estimate,
      assigned_to,
      item_status,
      status_before_checkin,
      status_during_occupancy,
      status_after_exit,
      stage_notes,
    } = body;

    let resolvedCategory = String(category || "").trim();
    let resolvedCategoryId: string | null = category_id ? String(category_id) : null;

    if (resolvedCategoryId) {
      const { data: categoryData, error: categoryError } = await supabaseAdmin
        .from("inventory_categories")
        .select("id, name")
        .eq("id", resolvedCategoryId)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { success: false, error: "Invalid category selected" },
          { status: 400 }
        );
      }

      resolvedCategory = categoryData.name;
      resolvedCategoryId = categoryData.id;
    }

    if (!resolvedCategory) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabaseAdmin
      .from("inventory_items")
      .insert({
        name,
        category: resolvedCategory,
        category_id: resolvedCategoryId,
        room_id: room_id || null,
        condition: condition || "good",
        assigned_to: assigned_to || null,
        price_estimate: price_estimate ? parseFloat(price_estimate) : 0,
        item_status: normalizeItemStatus(item_status) || "good",
        status_before_checkin: normalizeItemStatus(status_before_checkin),
        status_during_occupancy: normalizeItemStatus(status_during_occupancy),
        status_after_exit: normalizeItemStatus(status_after_exit),
        stage_notes: stage_notes ? String(stage_notes).trim() || null : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Create inventory error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole([
      "admin",
      "super_admin",
      "porter",
      "other",
    ]);

    const body = await request.json();
    const itemId = String(body.itemId || body.id || "").trim();

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "itemId is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.item_status !== undefined) {
      const status = normalizeItemStatus(body.item_status);
      if (!status) {
        return NextResponse.json(
          { success: false, error: "Invalid item status" },
          { status: 400 }
        );
      }
      updates.item_status = status;
    }

    for (const stageKey of ["status_before_checkin", "status_during_occupancy", "status_after_exit"] as const) {
      if (body[stageKey] !== undefined) {
        if (body[stageKey] === null || body[stageKey] === "") {
          updates[stageKey] = null;
        } else {
          const status = normalizeItemStatus(body[stageKey]);
          if (!status) {
            return NextResponse.json(
              { success: false, error: `Invalid value for ${stageKey}` },
              { status: 400 }
            );
          }
          updates[stageKey] = status;
        }
      }
    }

    if (body.stage_notes !== undefined) {
      updates.stage_notes = body.stage_notes ? String(body.stage_notes).trim() || null : null;
    }

    if (body.condition !== undefined && typeof body.condition === "string") {
      updates.condition = body.condition;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabaseAdmin
      .from("inventory_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Update inventory item error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}
