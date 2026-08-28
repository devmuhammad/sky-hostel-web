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
