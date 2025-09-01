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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, block, total_beds } = body;

    if (!name || !block || !total_beds) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine bed type based on total_beds
    const bed_type = total_beds === 6 ? "6_bed" : "4_bed";

    // Generate available beds based on total_beds
    const generateAvailableBeds = (totalBeds: number) => {
      const bedLabels = [];
      for (let i = 1; i <= totalBeds; i++) {
        bedLabels.push(`Bed ${i} (Top)`);
        bedLabels.push(`Bed ${i} (Down)`);
      }
      return bedLabels;
    };

    const available_beds = generateAvailableBeds(total_beds);

    const { data: room, error } = await supabaseAdmin
      .from("rooms")
      .insert({
        name,
        block,
        total_beds,
        bed_type,
        available_beds,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create room" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: room,
    });
  } catch (error) {
    console.error("Room creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
