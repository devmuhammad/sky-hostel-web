import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFull = searchParams.get("includeFull") === "true";

    let rooms: Array<{ block: string; room_availability_status?: string }> = [];

    if (includeFull) {
      const { data, error } = await supabaseAdmin
        .from("rooms")
        .select("block, room_availability_status")
        .order("block");

      if (error && error.code === "42703") {
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from("rooms")
          .select("block")
          .order("block");
        if (fallbackError) throw fallbackError;
        rooms = fallbackData || [];
      } else if (error) {
        throw error;
      } else {
        rooms = data || [];
      }
    } else {
      const { data, error } = await supabaseAdmin
        .from("rooms")
        .select("block, room_availability_status")
        .eq("room_availability_status", "open")
        .order("block");

      if (error && error.code === "42703") {
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from("rooms")
          .select("block")
          .order("block");
        if (fallbackError) throw fallbackError;
        rooms = fallbackData || [];
      } else if (error) {
        throw error;
      } else {
        rooms = data || [];
      }
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
