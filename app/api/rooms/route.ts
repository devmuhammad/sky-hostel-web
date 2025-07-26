import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const block = searchParams.get("block");

    let query = supabaseAdmin
      .from("rooms")
      .select("*")
      .order("block")
      .order("name");

    if (block) {
      query = query.eq("block", block);
    }

    const { data: rooms, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: { message: "Failed to fetch rooms" } },
        { status: 500 }
      );
    }

    // Filter rooms with available beds
    const availableRooms =
      rooms?.filter((room) => room.available_beds.length > 0) || [];

    return NextResponse.json({
      success: true,
      data: availableRooms,
    });
  } catch (error) {
    console.error("Rooms fetch error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}

// Get unique blocks
export async function POST(request: NextRequest) {
  try {
    const { data: rooms, error } = await supabaseAdmin
      .from("rooms")
      .select("block")
      .order("block");

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: { message: "Failed to fetch blocks" } },
        { status: 500 }
      );
    }

    const uniqueBlocks = [
      ...new Set(rooms?.map((room: { block: string }) => room.block) || []),
    ];

    return NextResponse.json({
      success: true,
      data: uniqueBlocks,
    });
  } catch (error) {
    console.error("Blocks fetch error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
