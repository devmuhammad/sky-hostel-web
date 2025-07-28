import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
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
