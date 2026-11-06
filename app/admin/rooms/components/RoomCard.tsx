"use client";

import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Room, Student } from "@/shared/store/appStore";
import { getBedStatus, getSelectableBedCount } from "../utils/roomUtils";
import Link from "next/link";

interface RoomCardProps {
  room: Room;
  students: Student[];
  onViewDetails: (room: Room) => void;
  onSetAvailabilityStatus: (room: Room, status: "open" | "locked") => void;
  onReserveBed: (room: Room, bedspaceLabel: string) => void;
  onCancelReservation: (room: Room, bedspaceLabel: string) => void;
  isStatusUpdating?: boolean;
  statusUpdatingTo?: "open" | "locked" | null;
  reservationBusyLabel?: string | null;
}

function BedSlot({
  label,
  reservedFor,
  student,
  position,
  onReserve,
  onCancel,
  busy,
}: {
  label: string;
  reservedFor?: string;
  student?: Student;
  position: string;
  onReserve: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div className="mt-1 first:mt-0">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-gray-600">
        {student ? (
          <div>
            <div className="font-medium">
              {student.first_name} {student.last_name}
            </div>
            <div className="text-gray-500">{student.matric_number}</div>
            <div className="text-xs text-gray-400">{position}</div>
          </div>
        ) : reservedFor ? (
          <div>
            <div className="font-medium text-amber-700">
              Reserved for {reservedFor}
            </div>
            <div className="text-gray-500">{position}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 h-7 px-2 text-xs"
              onClick={onCancel}
              disabled={busy}
            >
              {busy ? "Updating..." : "Cancel reserve"}
            </Button>
          </div>
        ) : (
          <div>
            <div className="font-medium text-green-600">Available</div>
            <div className="text-gray-500">{position}</div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 h-7 px-2 text-xs"
              onClick={onReserve}
              disabled={busy}
            >
              {busy ? "Updating..." : "Reserve"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function RoomCard({
  room,
  students,
  onViewDetails,
  onSetAvailabilityStatus,
  onReserveBed,
  onCancelReservation,
  isStatusUpdating = false,
  statusUpdatingTo = null,
  reservationBusyLabel = null,
}: RoomCardProps) {
  const roomStatus = room.room_availability_status || "open";
  const selectableCount = getSelectableBedCount(room, students);
  const displayStatus = selectableCount === 0 ? "locked" : roomStatus;

  return (
    <CardContainer title={`${room.block} - ${room.name}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {Math.floor(room.total_beds / 2)} beds ({room.total_beds} bedspaces)
          </span>
          <span className="text-sm text-gray-600">
            {selectableCount} bedspaces available
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Availability</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              displayStatus === "open"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            {displayStatus === "open" ? "Open" : "Locked"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from(
            { length: Math.ceil(room.total_beds / 2) },
            (_, index) => {
              const bedStatus = getBedStatus(room, index, students);
              const hasAvailable =
                bedStatus.isTopAvailable || bedStatus.isDownAvailable;
              const hasReserved =
                Boolean(bedStatus.reservedTop) || Boolean(bedStatus.reservedDown);

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    hasAvailable
                      ? "bg-green-50 border-green-200"
                      : hasReserved
                        ? "bg-amber-50 border-amber-200"
                        : "bg-red-50 border-red-200"
                  }`}
                >
                  <BedSlot
                    label={bedStatus.topBedLabel}
                    reservedFor={bedStatus.reservedTop?.reserved_for_name}
                    student={bedStatus.studentInTop}
                    position="Top bunk"
                    onReserve={() => onReserveBed(room, bedStatus.topBedLabel)}
                    onCancel={() =>
                      onCancelReservation(room, bedStatus.topBedLabel)
                    }
                    busy={
                      reservationBusyLabel ===
                      `${room.id}:${bedStatus.topBedLabel}`
                    }
                  />
                  <BedSlot
                    label={bedStatus.downBedLabel}
                    reservedFor={bedStatus.reservedDown?.reserved_for_name}
                    student={bedStatus.studentInDown}
                    position="Down bunk"
                    onReserve={() => onReserveBed(room, bedStatus.downBedLabel)}
                    onCancel={() =>
                      onCancelReservation(room, bedStatus.downBedLabel)
                    }
                    busy={
                      reservationBusyLabel ===
                      `${room.id}:${bedStatus.downBedLabel}`
                    }
                  />
                </div>
              );
            }
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={displayStatus === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => onSetAvailabilityStatus(room, "open")}
            disabled={isStatusUpdating || selectableCount === 0}
          >
            {isStatusUpdating && statusUpdatingTo === "open"
              ? "Updating..."
              : "Open"}
          </Button>
          <Button
            variant={displayStatus === "locked" ? "default" : "outline"}
            size="sm"
            onClick={() => onSetAvailabilityStatus(room, "locked")}
            disabled={isStatusUpdating}
          >
            {isStatusUpdating && statusUpdatingTo === "locked"
              ? "Updating..."
              : "Lock"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(room)}
            className="w-full"
          >
            View Details
          </Button>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href={`/admin/inventory/rooms/${room.id}`}>Room Inventory</Link>
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
