"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";

interface NewRoom {
  name: string;
  block: string;
  total_beds: number;
}

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  newRoom: NewRoom;
  onNewRoomChange: (room: NewRoom) => void;
  onAddRoom: () => void;
}

export function AddRoomModal({
  isOpen,
  onClose,
  newRoom,
  onNewRoomChange,
  onAddRoom,
}: AddRoomModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Room">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Room Name
          </label>
          <Input
            value={newRoom.name}
            onChange={(e) =>
              onNewRoomChange({ ...newRoom, name: e.target.value })
            }
            placeholder="e.g., Room 101"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block
          </label>
          <Input
            value={newRoom.block}
            onChange={(e) =>
              onNewRoomChange({ ...newRoom, block: e.target.value })
            }
            placeholder="e.g., Block A"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Beds
          </label>
          <select
            value={newRoom.total_beds}
            onChange={(e) =>
              onNewRoomChange({
                ...newRoom,
                total_beds: parseInt(e.target.value),
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={4}>4 Beds</option>
            <option value={6}>6 Beds</option>
            <option value={8}>8 Beds</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddRoom}>Add Room</Button>
        </div>
      </div>
    </Modal>
  );
}
