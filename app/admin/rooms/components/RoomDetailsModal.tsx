"use client";

import { Modal } from "@/shared/components/ui/modal";
import { Room, Student } from "@/shared/store/appStore";
import { getBedStatus, getSelectableBedCount } from "../utils/roomUtils";

interface RoomDetailsModalProps {
  room: Room | null;
  students: Student[];
  onClose: () => void;
}

function slotBadge(available: boolean, reserved: boolean) {
  if (available) return "bg-green-100 text-green-800";
  if (reserved) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function slotLabel(available: boolean, reserved: boolean) {
  if (available) return "Available";
  if (reserved) return "Reserved";
  return "Occupied";
}

export function RoomDetailsModal({
  room,
  students,
  onClose,
}: RoomDetailsModalProps) {
  if (!room) return null;

  const selectableCount = getSelectableBedCount(room, students);
  const displayStatus =
    selectableCount === 0 ? "locked" : room.room_availability_status || "open";

  return (
    <Modal
      isOpen={!!room}
      onClose={onClose}
      title={`${room.block} - ${room.name} Details`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Room Name
            </label>
            <p className="text-sm text-gray-900">{room.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Block
            </label>
            <p className="text-sm text-gray-900">{room.block}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Beds
            </label>
            <p className="text-sm text-gray-900">
              {Math.floor(room.total_beds / 2)} beds ({room.total_beds}{" "}
              bedspaces)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Available Bedspaces
            </label>
            <p className="text-sm text-gray-900">
              {selectableCount} bedspaces available
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Availability Status
            </label>
            <p className="text-sm text-gray-900 capitalize">{displayStatus}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bed Assignments
          </label>
          <div className="space-y-2">
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
                        : bedStatus.reservedTop || bedStatus.reservedDown
                          ? "bg-amber-50 border-amber-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {bedStatus.topBedLabel}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${slotBadge(
                          bedStatus.isTopAvailable,
                          Boolean(bedStatus.reservedTop)
                        )}`}
                      >
                        {slotLabel(
                          bedStatus.isTopAvailable,
                          Boolean(bedStatus.reservedTop)
                        )}
                      </span>
                    </div>
                    {bedStatus.isTopAvailable && (
                      <div className="mt-1 text-xs text-gray-500">
                        Top available
                      </div>
                    )}
                    {bedStatus.reservedTop && (
                      <div className="mt-2 text-sm">
                        <strong>Reserved for:</strong>{" "}
                        {bedStatus.reservedTop.reserved_for_name}
                      </div>
                    )}
                    {bedStatus.studentInTop && (
                      <div className="mt-2 text-sm">
                        <div>
                          <strong>Student:</strong>{" "}
                          {bedStatus.studentInTop.first_name}{" "}
                          {bedStatus.studentInTop.last_name}
                        </div>
                        <div>
                          <strong>Matric:</strong>{" "}
                          {bedStatus.studentInTop.matric_number}
                        </div>
                        <div>
                          <strong>Phone:</strong> {bedStatus.studentInTop.phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <strong>Position:</strong> Top bunk
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium">
                        {bedStatus.downBedLabel}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${slotBadge(
                          bedStatus.isDownAvailable,
                          Boolean(bedStatus.reservedDown)
                        )}`}
                      >
                        {slotLabel(
                          bedStatus.isDownAvailable,
                          Boolean(bedStatus.reservedDown)
                        )}
                      </span>
                    </div>
                    {bedStatus.isDownAvailable && (
                      <div className="mt-1 text-xs text-gray-500">
                        Down available
                      </div>
                    )}
                    {bedStatus.reservedDown && (
                      <div className="mt-2 text-sm">
                        <strong>Reserved for:</strong>{" "}
                        {bedStatus.reservedDown.reserved_for_name}
                      </div>
                    )}
                    {bedStatus.studentInDown && (
                      <div className="mt-2 text-sm">
                        <div>
                          <strong>Student:</strong>{" "}
                          {bedStatus.studentInDown.first_name}{" "}
                          {bedStatus.studentInDown.last_name}
                        </div>
                        <div>
                          <strong>Matric:</strong>{" "}
                          {bedStatus.studentInDown.matric_number}
                        </div>
                        <div>
                          <strong>Phone:</strong>{" "}
                          {bedStatus.studentInDown.phone}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <strong>Position:</strong> Down bunk
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
