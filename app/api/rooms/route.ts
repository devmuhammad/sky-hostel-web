import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const block = searchParams.get("block");
    const includeFull = searchParams.get("includeFull") === "true";

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

    // Default behavior keeps registration flow by only returning rooms with availability.
    // Inventory and admin flows can request all rooms with ?includeFull=true.
    const filteredRooms = includeFull
      ? rooms || []
      : rooms?.filter(
          (room) =>
            room.available_beds.length > 0 &&
            (room.room_availability_status || "open") === "open"
        ) || [];

    return NextResponse.json({
      success: true,
      data: filteredRooms,
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

    const bed_type = total_beds === 6 ? "6_bed" : "4_bed";

    const generateAvailableBeds = (totalBeds: number) => {
      const bedLabels = [];
      const physicalBeds = Math.floor(totalBeds / 2);
      for (let i = 1; i <= physicalBeds; i++) {
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
        room_availability_status: "open",
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
