import {
  parseBedReservations,
  reservationForBed,
  syncRoomStatusFromAvailableBeds,
} from "@/shared/utils/room-availability";

type SupabaseLike = {
  from: (table: string) => any;
};

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    Boolean(error.message?.includes("bed_reservations"))
  );
}

async function loadRoom(
  supabase: SupabaseLike,
  matcher: { id?: string; block?: string; name?: string }
) {
  const apply = (query: any) => {
    if (matcher.id) return query.eq("id", matcher.id);
    return query.eq("block", matcher.block).eq("name", matcher.name);
  };

  const withReservations = apply(
    supabase
      .from("rooms")
      .select(
        "id, available_beds, room_availability_status, bed_reservations"
      )
  ).maybeSingle();

  const first = await withReservations;
  if (first.error && isMissingColumnError(first.error)) {
    const fallback = await apply(
      supabase.from("rooms").select("id, available_beds, room_availability_status")
    ).maybeSingle();
    return fallback;
  }
  return first;
}

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

  const { data: roomRow, error: roomError } = await loadRoom(supabase, {
    block,
    name: room,
  });

  if (roomError) {
    return { released: false, error: roomError.message || "Room lookup failed" };
  }

  if (!roomRow) {
    return { released: false, error: "Room not found for assignment" };
  }

  const reserved = reservationForBed(roomRow.bed_reservations, bedspace_label);
  const beds: string[] = Array.isArray(roomRow.available_beds)
    ? [...roomRow.available_beds]
    : [];

  if (!reserved && !beds.includes(bedspace_label)) {
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
  }

  await syncRoomStatusFromAvailableBeds(supabase, roomRow.id, {
    openIfFreed: true,
  });
  return { released: true, roomId: roomRow.id };
}

/**
 * Returns a bedspace to rooms.available_beds by room id, e.g. to undo a claim
 * when the student record could not be saved.
 */
export async function restoreBedspaceById(
  supabase: SupabaseLike,
  params: { roomId: string; bedspace_label: string }
): Promise<{ released: boolean; error?: string }> {
  const { roomId, bedspace_label } = params;

  const { data: roomRow, error: roomError } = await loadRoom(supabase, {
    id: roomId,
  });

  if (roomError || !roomRow) {
    return {
      released: false,
      error: roomError?.message || "Room not found",
    };
  }

  const reserved = reservationForBed(roomRow.bed_reservations, bedspace_label);
  const beds: string[] = Array.isArray(roomRow.available_beds)
    ? [...roomRow.available_beds]
    : [];

  if (!reserved && !beds.includes(bedspace_label)) {
    const { error: updateError } = await supabase
      .from("rooms")
      .update({ available_beds: [...beds, bedspace_label] })
      .eq("id", roomId);

    if (updateError) {
      return {
        released: false,
        error: updateError.message || "Failed to restore bedspace",
      };
    }
  }

  await syncRoomStatusFromAvailableBeds(supabase, roomId, {
    openIfFreed: true,
  });
  return { released: true };
}

/**
 * Removes a bedspace from rooms.available_beds (claims it for a student).
 */
export async function claimBedspace(
  supabase: SupabaseLike,
  params: {
    roomId: string;
    bedspace_label: string;
    allowReservedOrLocked?: boolean;
  }
): Promise<{ claimed: boolean; error?: string }> {
  const { roomId, bedspace_label, allowReservedOrLocked = false } = params;

  if (!roomId || !bedspace_label) {
    return { claimed: false, error: "Missing room or bedspace to claim" };
  }

  const { data: roomRow, error: lookupError } = await loadRoom(supabase, {
    id: roomId,
  });

  if (lookupError) {
    return {
      claimed: false,
      error: lookupError.message || "Room lookup failed",
    };
  }

  if (!roomRow) {
    return { claimed: false, error: "Room not found" };
  }

  const status = roomRow.room_availability_status || "open";
  const reserved = reservationForBed(roomRow.bed_reservations, bedspace_label);
  const beds: string[] = Array.isArray(roomRow.available_beds)
    ? [...roomRow.available_beds]
    : [];
  const listed = beds.includes(bedspace_label);

  if (status !== "open" && !allowReservedOrLocked) {
    return { claimed: false, error: "Room is currently unavailable" };
  }

  if (!listed && !(allowReservedOrLocked && reserved)) {
    return { claimed: false, error: "Bedspace is no longer available" };
  }

  const updatedBeds = beds.filter((bed) => bed !== bedspace_label);
  const reservations = parseBedReservations(roomRow.bed_reservations).filter(
    (item) => item.bedspace_label !== bedspace_label
  );

  const patch: Record<string, unknown> = { available_beds: updatedBeds };
  if (roomRow.bed_reservations !== undefined) {
    patch.bed_reservations = reservations;
  }

  let { error: updateError } = await supabase
    .from("rooms")
    .update(patch)
    .eq("id", roomId);

  if (updateError && isMissingColumnError(updateError)) {
    const retry = await supabase
      .from("rooms")
      .update({ available_beds: updatedBeds })
      .eq("id", roomId);
    updateError = retry.error;
  }

  if (updateError) {
    return {
      claimed: false,
      error: updateError.message || "Failed to claim bedspace",
    };
  }

  await syncRoomStatusFromAvailableBeds(supabase, roomId);
  return { claimed: true };
}
