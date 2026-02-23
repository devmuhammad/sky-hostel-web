"use client";

import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Room, Student } from "@/shared/store/appStore";
import { getBedStatus } from "../utils/roomUtils";
import Link from "next/link";

interface RoomCardProps {
  room: Room;
  students: Student[];
  onViewDetails: (room: Room) => void;
  onSetAvailabilityStatus: (
    room: Room,
    status: "open" | "reserved" | "locked"
  ) => void;
  isStatusUpdating?: boolean;
  statusUpdatingTo?: "open" | "reserved" | "locked" | null;
}

export function RoomCard({
  room,
  students,
  onViewDetails,
  onSetAvailabilityStatus,
  isStatusUpdating = false,
  statusUpdatingTo = null,
}: RoomCardProps) {
  const roomStatus = room.room_availability_status || "open";

  return (
    <CardContainer title={`${room.block} - ${room.name}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {Math.floor(room.total_beds / 2)} beds ({room.total_beds} bedspaces)
          </span>
          <span className="text-sm text-gray-600">
            {(() => {
              // Count beds that are actually available (not occupied)
              const assignedStudents = students.filter(
                (student) =>
                  student.block === room.block &&
                  student.room === room.name &&
                  student.bedspace_label
              );
              // Count available bedspaces by checking which ones are truly free
              const availableBedspaces = room.available_beds.filter(
                (bedLabel) => {
                  const isOccupied = assignedStudents.some(
                    (student) => student.bedspace_label === bedLabel
                  );
                  return !isOccupied;
                }
              );
              return `${availableBedspaces.length} bedspaces available`;
            })()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Availability</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              roomStatus === "open"
                ? "bg-emerald-100 text-emerald-700"
                : roomStatus === "reserved"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {roomStatus === "open"
              ? "Open"
              : roomStatus === "reserved"
                ? "Reserved"
                : "Locked"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from(
            { length: Math.ceil(room.total_beds / 2) },
            (_, index) => {
              const bedStatus = getBedStatus(room, index, students);

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    bedStatus.isTopAvailable || bedStatus.isDownAvailable
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {bedStatus.topBedLabel}
                  </div>
                  <div className="text-xs text-gray-600">
                    {bedStatus.isTopAvailable ? (
                      <div>
                        <div className="font-medium text-green-600">
                          Available
                        </div>
                        <div className="text-gray-500">Top available</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {bedStatus.studentInTop?.first_name}{" "}
                          {bedStatus.studentInTop?.last_name}
                        </div>
                        <div className="text-gray-500">
                          {bedStatus.studentInTop?.matric_number}
                        </div>
                        <div className="text-xs text-gray-400">Top bunk</div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {bedStatus.downBedLabel}
                  </div>
                  <div className="text-xs text-gray-600">
                    {bedStatus.isDownAvailable ? (
                      <div>
                        <div className="font-medium text-green-600">
                          Available
                        </div>
                        <div className="text-gray-500">Down available</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">
                          {bedStatus.studentInDown?.first_name}{" "}
                          {bedStatus.studentInDown?.last_name}
                        </div>
                        <div className="text-gray-500">
                          {bedStatus.studentInDown?.matric_number}
                        </div>
                        <div className="text-xs text-gray-400">Down bunk</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={roomStatus === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => onSetAvailabilityStatus(room, "open")}
            disabled={isStatusUpdating}
          >
            {isStatusUpdating && statusUpdatingTo === "open"
              ? "Updating..."
              : "Open"}
          </Button>
          <Button
            variant={roomStatus === "reserved" ? "default" : "outline"}
            size="sm"
            onClick={() => onSetAvailabilityStatus(room, "reserved")}
            disabled={isStatusUpdating}
          >
            {isStatusUpdating && statusUpdatingTo === "reserved"
              ? "Updating..."
              : "Reserve"}
          </Button>
          <Button
            variant={roomStatus === "locked" ? "default" : "outline"}
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
