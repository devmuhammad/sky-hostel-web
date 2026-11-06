import { fetchAllRows } from "@/shared/utils/supabase-fetch";

export type RoomAvailabilityStatus = "open" | "reserved" | "locked";

export type BedReservation = {
  bedspace_label: string;
  reserved_for_name: string;
  created_at?: string;
};

type SupabaseLike = {
  from: (table: string) => any;
};

export function expectedBedLabels(totalBeds: number): string[] {
  const physical = Math.max(0, Math.floor(Number(totalBeds) / 2));
  const labels: string[] = [];
  for (let i = 1; i <= physical; i += 1) {
    labels.push(`Bed ${i} (Top)`);
    labels.push(`Bed ${i} (Down)`);
  }
  return labels;
}

export function parseBedReservations(value: unknown): BedReservation[] {
  if (!Array.isArray(value)) return [];

  const reservations: BedReservation[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const bedspace_label =
      typeof row.bedspace_label === "string" ? row.bedspace_label.trim() : "";
    const reserved_for_name =
      typeof row.reserved_for_name === "string"
        ? row.reserved_for_name.trim()
        : "";
    if (!bedspace_label || !reserved_for_name) continue;

    const reservation: BedReservation = {
      bedspace_label,
      reserved_for_name,
    };
    if (typeof row.created_at === "string") {
      reservation.created_at = row.created_at;
    }
    reservations.push(reservation);
  }
  return reservations;
}

export function reservationForBed(
  reservations: BedReservation[] | unknown,
  bedspaceLabel: string
): BedReservation | undefined {
  return parseBedReservations(reservations).find(
    (item) => item.bedspace_label === bedspaceLabel
  );
}

function sameBeds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

function isMissingColumnError(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    Boolean(error.message?.includes("bed_reservations"))
  );
}

async function updateRoomRow(
  supabase: SupabaseLike,
  roomId: string,
  patch: Record<string, unknown>
) {
  const first = await supabase.from("rooms").update(patch).eq("id", roomId);
  if (!first.error || !("bed_reservations" in patch) || !isMissingColumnError(first.error)) {
    return first;
  }
  const { bed_reservations: _ignored, ...rest } = patch;
  if (Object.keys(rest).length === 0) {
    return { error: null };
  }
  return supabase.from("rooms").update(rest).eq("id", roomId);
}

type OccupancySnapshot = {
  availableBeds: string[];
  reservations: BedReservation[];
  status: RoomAvailabilityStatus;
};

export function computeRoomOccupancy(params: {
  totalBeds: number;
  occupiedLabels: string[];
  reservations: BedReservation[];
  currentStatus?: string | null;
  openIfFreed?: boolean;
}): OccupancySnapshot {
  const expected = expectedBedLabels(params.totalBeds);
  const occupied = new Set(params.occupiedLabels.filter(Boolean));
  const reservations = parseBedReservations(params.reservations).filter(
    (item) => expected.includes(item.bedspace_label) && !occupied.has(item.bedspace_label)
  );
  const reserved = new Set(reservations.map((item) => item.bedspace_label));
  const availableBeds = expected.filter(
    (label) => !occupied.has(label) && !reserved.has(label)
  );

  const current = (params.currentStatus || "open") as RoomAvailabilityStatus;
  let status: RoomAvailabilityStatus = current === "reserved" ? "open" : current;
  if (availableBeds.length === 0) {
    status = "locked";
  } else if (current === "reserved" || params.openIfFreed) {
    status = "open";
  }

  return { availableBeds, reservations, status };
}

export async function syncRoomStatusFromAvailableBeds(
  supabase: SupabaseLike,
  roomId: string,
  options?: { openIfFreed?: boolean }
): Promise<RoomAvailabilityStatus | null> {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("id, available_beds, room_availability_status")
    .eq("id", roomId)
    .maybeSingle();

  if (error || !room) return null;

  const free = Array.isArray(room.available_beds)
    ? room.available_beds.length
    : 0;
  const current = (room.room_availability_status ||
    "open") as RoomAvailabilityStatus;
  let next: RoomAvailabilityStatus =
    current === "reserved" && free > 0 ? "open" : current;

  if (free === 0) {
    next = "locked";
  } else if (options?.openIfFreed) {
    next = "open";
  }

  if (next !== current) {
    await supabase
      .from("rooms")
      .update({ room_availability_status: next })
      .eq("id", roomId);
  }

  return next;
}

export async function syncRoomAvailability(
  supabase: SupabaseLike,
  roomId: string,
  options?: { openIfFreed?: boolean }
): Promise<{
  status: RoomAvailabilityStatus;
  available_beds: string[];
  bed_reservations: BedReservation[];
} | null> {
  let roomRow: {
    id: string;
    block?: string;
    name?: string;
    total_beds?: number;
    available_beds?: string[];
    room_availability_status?: string;
    bed_reservations?: unknown;
  } | null = null;

  const withReservations = await supabase
    .from("rooms")
    .select(
      "id, block, name, total_beds, available_beds, room_availability_status, bed_reservations"
    )
    .eq("id", roomId)
    .maybeSingle();

  if (withReservations.error && isMissingColumnError(withReservations.error)) {
    const fallback = await supabase
      .from("rooms")
      .select("id, block, name, total_beds, available_beds, room_availability_status")
      .eq("id", roomId)
      .maybeSingle();
    if (fallback.error || !fallback.data) return null;
    roomRow = fallback.data;
  } else if (withReservations.error || !withReservations.data) {
    return null;
  } else {
    roomRow = withReservations.data;
  }

  if (!roomRow) return null;

  const { data: occupants } = await supabase
    .from("students")
    .select("bedspace_label")
    .eq("block", roomRow.block)
    .eq("room", roomRow.name);

  const snapshot = computeRoomOccupancy({
    totalBeds: Number(roomRow.total_beds || 0),
    occupiedLabels: (occupants || []).map((row: { bedspace_label?: string }) =>
      String(row.bedspace_label || "")
    ),
    reservations: parseBedReservations(roomRow.bed_reservations),
    currentStatus: roomRow.room_availability_status,
    openIfFreed: options?.openIfFreed,
  });

  const currentBeds = Array.isArray(roomRow.available_beds)
    ? roomRow.available_beds
    : [];
  const currentReservations = parseBedReservations(roomRow.bed_reservations);
  const currentStatus = (roomRow.room_availability_status || "open") as RoomAvailabilityStatus;

  const bedsChanged = !sameBeds(currentBeds, snapshot.availableBeds);
  const reservationsChanged = !sameBeds(
    currentReservations.map((item) => `${item.bedspace_label}:${item.reserved_for_name}`),
    snapshot.reservations.map((item) => `${item.bedspace_label}:${item.reserved_for_name}`)
  );
  const statusChanged = currentStatus !== snapshot.status;

  if (bedsChanged || reservationsChanged || statusChanged) {
    const patch: Record<string, unknown> = {};
    if (bedsChanged) patch.available_beds = snapshot.availableBeds;
    if (reservationsChanged) patch.bed_reservations = snapshot.reservations;
    if (statusChanged) patch.room_availability_status = snapshot.status;
    await updateRoomRow(supabase, roomId, patch);
  }

  return {
    status: snapshot.status,
    available_beds: snapshot.availableBeds,
    bed_reservations: snapshot.reservations,
  };
}

export async function reconcileAllRoomAvailability(supabase: SupabaseLike) {
  let rooms: Array<{
    id: string;
    block: string;
    name: string;
    total_beds: number;
    available_beds: string[];
    room_availability_status?: string;
    bed_reservations?: unknown;
  }> = [];

  const withReservations = await supabase
    .from("rooms")
    .select(
      "id, block, name, total_beds, available_beds, room_availability_status, bed_reservations"
    );
  if (withReservations.error && isMissingColumnError(withReservations.error)) {
    const fallback = await supabase
      .from("rooms")
      .select("id, block, name, total_beds, available_beds, room_availability_status");
    rooms = fallback.data || [];
  } else {
    rooms = withReservations.data || [];
  }

  const students = await fetchAllRows<{
    block: string | null;
    room: string | null;
    bedspace_label: string | null;
  }>(supabase, "students", "block, room, bedspace_label");

  const occupiedByRoom = new Map<string, string[]>();
  for (const student of students) {
    if (!student.block || !student.room || !student.bedspace_label) continue;
    const key = `${student.block}::${student.room}`;
    const list = occupiedByRoom.get(key) || [];
    list.push(student.bedspace_label);
    occupiedByRoom.set(key, list);
  }

  let updated = 0;
  let locked = 0;
  let opened = 0;

  for (const room of rooms) {
    const snapshot = computeRoomOccupancy({
      totalBeds: Number(room.total_beds || 0),
      occupiedLabels: occupiedByRoom.get(`${room.block}::${room.name}`) || [],
      reservations: parseBedReservations(room.bed_reservations),
      currentStatus: room.room_availability_status,
    });

    const currentBeds = Array.isArray(room.available_beds) ? room.available_beds : [];
    const currentReservations = parseBedReservations(room.bed_reservations);
    const currentStatus = (room.room_availability_status || "open") as RoomAvailabilityStatus;
    const patch: Record<string, unknown> = {};

    if (!sameBeds(currentBeds, snapshot.availableBeds)) {
      patch.available_beds = snapshot.availableBeds;
    }
    if (
      !sameBeds(
        currentReservations.map((item) => `${item.bedspace_label}:${item.reserved_for_name}`),
        snapshot.reservations.map((item) => `${item.bedspace_label}:${item.reserved_for_name}`)
      )
    ) {
      patch.bed_reservations = snapshot.reservations;
    }
    if (currentStatus !== snapshot.status) {
      patch.room_availability_status = snapshot.status;
      if (snapshot.status === "locked") locked += 1;
      if (snapshot.status === "open" && currentStatus !== "open") opened += 1;
    }

    if (Object.keys(patch).length === 0) continue;
    const result = await updateRoomRow(supabase, room.id, patch);
    if (!result.error) updated += 1;
  }

  return { scanned: rooms.length, updated, locked, opened };
}
