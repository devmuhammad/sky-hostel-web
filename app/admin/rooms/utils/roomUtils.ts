import { Room, Student } from "@/shared/store/appStore";
import {
  expectedBedLabels,
  parseBedReservations,
  reservationForBed,
  type BedReservation,
} from "@/shared/utils/room-availability";

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
  reservedTop?: BedReservation;
  reservedDown?: BedReservation;
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

export function getSelectableBedCount(room: Room, students: Student[]): number {
  const occupied = new Set(
    students
      .filter(
        (student) =>
          student.block === room.block &&
          student.room === room.name &&
          student.bedspace_label
      )
      .map((student) => student.bedspace_label as string)
  );
  const reserved = new Set(
    parseBedReservations(room.bed_reservations).map((item) => item.bedspace_label)
  );
  return expectedBedLabels(room.total_beds).filter(
    (label) => !occupied.has(label) && !reserved.has(label)
  ).length;
}

export function roomHasReservations(room: Room): boolean {
  return parseBedReservations(room.bed_reservations).length > 0;
}

export function getBedStatus(
  room: Room,
  bedIndex: number,
  students: Student[]
): BedStatus {
  const bedNumber = bedIndex + 1;

  const topBedLabel = `Bed ${bedNumber} (Top)`;
  const downBedLabel = `Bed ${bedNumber} (Down)`;

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
  const reservedTop = studentInTop
    ? undefined
    : reservationForBed(room.bed_reservations, topBedLabel);
  const reservedDown = studentInDown
    ? undefined
    : reservationForBed(room.bed_reservations, downBedLabel);

  const isTopAvailable = !studentInTop && !reservedTop;
  const isDownAvailable = !studentInDown && !reservedDown;

  return {
    bedNumber,
    topBedLabel,
    downBedLabel,
    isTopAvailable,
    isDownAvailable,
    reservedTop,
    reservedDown,
    studentInTop,
    studentInDown,
  };
}
