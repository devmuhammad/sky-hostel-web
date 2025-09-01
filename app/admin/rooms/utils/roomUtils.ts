import { Room, Student } from "@/shared/store/appStore";

export interface OccupancyStats {
  totalRooms: number;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
}

export interface BedStatus {
  bedNumber: number;
  topBedLabel: string;
  downBedLabel: string;
  isTopAvailable: boolean;
  isDownAvailable: boolean;
  studentInTop: Student | undefined;
  studentInDown: Student | undefined;
}

export function getOccupancyStats(
  rooms: Room[],
  students: Student[]
): OccupancyStats {
  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);

  const occupiedBeds = students.filter(
    (student) => student.block && student.room && student.bedspace_label
  ).length;

  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate =
    totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return {
    totalRooms,
    totalBeds,
    availableBeds,
    occupiedBeds,
    occupancyRate,
  };
}

export function getStudentInBed(
  students: Student[],
  block: string,
  roomName: string,
  bedLabel: string
): Student | undefined {
  return students.find(
    (student) =>
      student.block === block &&
      student.room === roomName &&
      student.bedspace_label === bedLabel
  );
}

export function getBedStatus(
  room: Room,
  bedIndex: number,
  students: Student[]
): BedStatus {
  const bedNumber = bedIndex + 1;

  const topBedLabel = `Bed ${bedNumber} (Top)`;
  const downBedLabel = `Bed ${bedNumber} (Down)`;

  const isTopAvailable = room.available_beds.includes(topBedLabel);
  const isDownAvailable = room.available_beds.includes(downBedLabel);

  const studentInTop = getStudentInBed(
    students,
    room.block,
    room.name,
    topBedLabel
  );
  const studentInDown = getStudentInBed(
    students,
    room.block,
    room.name,
    downBedLabel
  );

  return {
    bedNumber,
    topBedLabel,
    downBedLabel,
    isTopAvailable,
    isDownAvailable,
    studentInTop,
    studentInDown,
  };
}
