import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";

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
    const { name, category, category_id, room_id, condition, price_estimate, assigned_to } = body;

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
