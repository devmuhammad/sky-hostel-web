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
  students: StudentData[]
): boolean {
  // Check if bed is in the available_beds array
  const isInAvailableBeds = room.available_beds.includes(bedLabel);

  // Check if any student is assigned to this bed
  const studentInBed = getStudentInBed(
    students,
    room.block,
    room.name,
    bedLabel
  );

  // Bed is available only if it's in available_beds AND no student is assigned
  return isInAvailableBeds && !studentInBed;
}

export function getAvailableBedspacesForRoom(
  room: RoomData,
  students: StudentData[],
  studentWeight?: number
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

      // Check if top bunk is available and user can use it
      const isTopAvailable = isBedActuallyAvailable(
        room,
        topBedLabel,
        students
      );
      const canUseTop = !studentWeight || studentWeight <= 60;

      if (isTopAvailable && canUseTop) {
        availableBedspaces.push({
          id: `${bunkName}-top`,
          bunk: bunkName,
          position: "top" as const,
          available: true,
          label: `${bunkName} Top Bunk`,
          weightRestriction: undefined,
        });
      }

      // Check if bottom bunk is available
      const isBottomAvailable = isBedActuallyAvailable(
        room,
        bottomBedLabel,
        students
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

export function getRoomsWithAvailableBedspaces(
  rooms: RoomData[],
  students: StudentData[],
  studentWeight?: number
): RoomData[] {
  return rooms.filter((room) => {
    const availableBedspaces = getAvailableBedspacesForRoom(
      room,
      students,
      studentWeight
    );
    return availableBedspaces.length > 0;
  });
}
