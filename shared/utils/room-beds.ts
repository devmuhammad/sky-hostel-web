type SupabaseLike = {
  from: (table: string) => any;
};

/**
 * Returns a bedspace to rooms.available_beds if it is not already listed.
 * Matches room by block + name (students.room stores the room name).
 */
export async function releaseBedspace(
  supabase: SupabaseLike,
  params: {
    block: string | null | undefined;
    room: string | null | undefined;
    bedspace_label: string | null | undefined;
  }
): Promise<{ released: boolean; roomId?: string; error?: string }> {
  const { block, room, bedspace_label } = params;

  if (!block || !room || !bedspace_label) {
    return { released: false, error: "Missing room assignment to release" };
  }

  const { data: roomRow, error: roomError } = await supabase
    .from("rooms")
    .select("id, available_beds")
    .eq("block", block)
    .eq("name", room)
    .maybeSingle();

  if (roomError) {
    return { released: false, error: roomError.message || "Room lookup failed" };
  }

  if (!roomRow) {
    return { released: false, error: "Room not found for assignment" };
  }

  const beds: string[] = Array.isArray(roomRow.available_beds)
    ? [...roomRow.available_beds]
    : [];

  if (beds.includes(bedspace_label)) {
    return { released: true, roomId: roomRow.id };
  }

  beds.push(bedspace_label);

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ available_beds: beds })
    .eq("id", roomRow.id);

  if (updateError) {
    return {
      released: false,
      roomId: roomRow.id,
      error: updateError.message || "Failed to restore bedspace",
    };
  }

  return { released: true, roomId: roomRow.id };
}

/**
 * Removes a bedspace from rooms.available_beds (claims it for a student).
 */
export async function claimBedspace(
  supabase: SupabaseLike,
  params: {
    roomId: string;
    bedspace_label: string;
  }
): Promise<{ claimed: boolean; error?: string }> {
  const { roomId, bedspace_label } = params;

  if (!roomId || !bedspace_label) {
    return { claimed: false, error: "Missing room or bedspace to claim" };
  }

  let roomRow: {
    id: string;
    available_beds: string[];
    room_availability_status?: string;
  } | null = null;

  const withStatus = await supabase
    .from("rooms")
    .select("id, available_beds, room_availability_status")
    .eq("id", roomId)
    .maybeSingle();

  if (withStatus.error && withStatus.error.code === "42703") {
    const fallback = await supabase
      .from("rooms")
      .select("id, available_beds")
      .eq("id", roomId)
      .maybeSingle();
    if (fallback.error) {
      return {
        claimed: false,
        error: fallback.error.message || "Room lookup failed",
      };
    }
    roomRow = fallback.data;
  } else if (withStatus.error) {
    return {
      claimed: false,
      error: withStatus.error.message || "Room lookup failed",
    };
  } else {
    roomRow = withStatus.data;
  }

  if (!roomRow) {
    return { claimed: false, error: "Room not found" };
  }

  if (
    roomRow.room_availability_status &&
    roomRow.room_availability_status !== "open"
  ) {
    return { claimed: false, error: "Room is currently unavailable" };
  }

  const beds: string[] = Array.isArray(roomRow.available_beds)
    ? [...roomRow.available_beds]
    : [];

  if (!beds.includes(bedspace_label)) {
    return { claimed: false, error: "Bedspace is no longer available" };
  }

  const updatedBeds = beds.filter((bed) => bed !== bedspace_label);

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ available_beds: updatedBeds })
    .eq("id", roomId);

  if (updateError) {
    return {
      claimed: false,
      error: updateError.message || "Failed to claim bedspace",
    };
  }

  return { claimed: true };
}
