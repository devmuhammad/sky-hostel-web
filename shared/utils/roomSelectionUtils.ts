interface RoomData {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  bed_type: string;
  available_beds: string[];
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  matric_number: string;
  block: string;
  room: string;
  bedspace_label: string;
  [key: string]: any;
}

interface Bedspace {
  id: string;
  bunk: string;
  position: "top" | "bottom";
  available: boolean;
  label?: string;
  weightRestriction?: string;
}

export const TOP_BUNK_MAX_WEIGHT_KG = 60;

export const TOP_BUNK_WEIGHT_MESSAGE = `Top bunks are limited to students ${TOP_BUNK_MAX_WEIGHT_KG}kg or under`;

export function getStudentInBed(
  students: StudentData[],
  block: string,
  roomName: string,
  bedLabel: string
): StudentData | undefined {
  return students.find(
    (student) =>
      student.block === block &&
      student.room === roomName &&
      student.bedspace_label === bedLabel
  );
}

export function isBedActuallyAvailable(
  room: RoomData,
  bedLabel: string,
  students: StudentData[],
  excludeStudentId?: string
): boolean {
  // Check if any other student is assigned to this bed
  const studentInBed = getStudentInBed(
    students,
    room.block,
    room.name,
    bedLabel
  );

  if (studentInBed && studentInBed.id !== excludeStudentId) {
    return false;
  }

  // Current occupant's own bed counts as selectable when reassigning them,
  // even though it is not listed in available_beds.
  if (studentInBed && studentInBed.id === excludeStudentId) {
    return true;
  }

  return room.available_beds.includes(bedLabel);
}

export function getAvailableBedspacesForRoom(
  room: RoomData,
  students: StudentData[],
  studentWeight?: number,
  excludeStudentId?: string
): Bedspace[] {
  const is6BedRoom = room.bed_type === "6_bed";

  const bunkMapping = is6BedRoom
    ? {
        "Bunk A": {
          top: "Bed 1 (Top)",
          bottom: "Bed 1 (Down)",
        },
        "Bunk B": {
          top: "Bed 2 (Top)",
          bottom: "Bed 2 (Down)",
        },
        "Bunk C": {
          top: "Bed 3 (Top)",
          bottom: "Bed 3 (Down)",
        },
      }
    : {
        "Bunk A": {
          top: "Bed 1 (Top)",
          bottom: "Bed 1 (Down)",
        },
        "Bunk B": {
          top: "Bed 2 (Top)",
          bottom: "Bed 2 (Down)",
        },
      };

  const availableBedspaces: Bedspace[] = [];

  // Check each bunk
  (is6BedRoom ? ["Bunk A", "Bunk B", "Bunk C"] : ["Bunk A", "Bunk B"]).forEach(
    (bunkName) => {
      const topBedLabel =
        bunkMapping[bunkName as keyof typeof bunkMapping]?.top || "";
      const bottomBedLabel =
        bunkMapping[bunkName as keyof typeof bunkMapping]?.bottom || "";

      // Free top bunks are always listed; students over the weight limit
      // see them as unavailable with the reason instead of not at all.
      const isTopAvailable = isBedActuallyAvailable(
        room,
        topBedLabel,
        students,
        excludeStudentId
      );
      const canUseTop =
        !studentWeight || studentWeight <= TOP_BUNK_MAX_WEIGHT_KG;

      if (isTopAvailable) {
        availableBedspaces.push({
          id: `${bunkName}-top`,
          bunk: bunkName,
          position: "top" as const,
          available: canUseTop,
          label: `${bunkName} Top Bunk`,
          weightRestriction: canUseTop ? undefined : TOP_BUNK_WEIGHT_MESSAGE,
        });
      }

      // Check if bottom bunk is available
      const isBottomAvailable = isBedActuallyAvailable(
        room,
        bottomBedLabel,
        students,
        excludeStudentId
      );

      if (isBottomAvailable) {
        availableBedspaces.push({
          id: `${bunkName}-bottom`,
          bunk: bunkName,
          position: "bottom" as const,
          available: true,
          label: `${bunkName} Bottom Bunk`,
          weightRestriction: undefined,
        });
      }
    }
  );

  return availableBedspaces;
}

export function countSelectableBedspaces(bedspaces: Bedspace[]): number {
  return bedspaces.filter((bedspace) => bedspace.available).length;
}

export function getRoomsWithAvailableBedspaces(
  rooms: RoomData[],
  students: StudentData[],
  studentWeight?: number,
  excludeStudentId?: string
): RoomData[] {
  return rooms.filter((room) => {
    const availableBedspaces = getAvailableBedspacesForRoom(
      room,
      students,
      studentWeight,
      excludeStudentId
    );
    return countSelectableBedspaces(availableBedspaces) > 0;
  });
}
