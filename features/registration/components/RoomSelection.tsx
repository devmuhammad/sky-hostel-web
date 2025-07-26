"use client";

import { useState, useEffect } from "react";
import { Select } from "@/shared/components/ui/select";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { ErrorAlert } from "@/shared/components/ui/error-alert";
import { useRooms, useBlocks } from "@/shared/hooks/useApi";

interface Room {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  available_beds: string[];
}

interface RoomSelectionProps {
  onRoomSelected: (selection: {
    block: string;
    room: string;
    bedspace: string;
    roomId: string;
  }) => void;
  onBack: () => void;
  studentData: any;
}

export default function RoomSelection({
  onRoomSelected,
  onBack,
  studentData,
}: RoomSelectionProps) {
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedBedspace, setBedspace] = useState("");

  // Use our reusable hooks
  const {
    data: blocks,
    isLoading: blocksLoading,
    error: blocksError,
  } = useBlocks();
  const {
    data: rooms,
    isLoading: roomsLoading,
    error: roomsError,
  } = useRooms(selectedBlock);

  // Reset room and bedspace selection when block changes
  useEffect(() => {
    if (selectedBlock) {
      setSelectedRoom("");
      setBedspace("");
    }
  }, [selectedBlock]);

  // Reset bedspace when room changes
  useEffect(() => {
    setBedspace("");
  }, [selectedRoom]);

  const handleConfirmSelection = () => {
    if (selectedBlock && selectedRoom && selectedBedspace && rooms) {
      const room = (rooms as Room[]).find((r: Room) => r.name === selectedRoom);
      if (room) {
        onRoomSelected({
          block: selectedBlock,
          room: selectedRoom,
          bedspace: selectedBedspace,
          roomId: room.id,
        });
      }
    }
  };

  const selectedRoomData = rooms
    ? (rooms as Room[]).find((r: Room) => r.name === selectedRoom)
    : null;
  const canConfirm = selectedBlock && selectedRoom && selectedBedspace;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h3 className="text-xl font-semibold">Select Your Accommodation</h3>

      {/* Error handling */}
      <ErrorAlert error={blocksError || roomsError} />

      {/* Block Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Block</label>
        <Select
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
          disabled={blocksLoading}
        >
          <option value="">
            {blocksLoading ? "Loading blocks..." : "Choose a block..."}
          </option>
          {Array.isArray(blocks) &&
            blocks.map((block: string) => (
              <option key={block} value={block}>
                Block {block}
              </option>
            ))}
        </Select>
      </div>

      {/* Room Selection */}
      {selectedBlock && (
        <div>
          <label className="block text-sm font-medium mb-2">Select Room</label>
          <Select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            disabled={roomsLoading}
          >
            <option value="">
              {roomsLoading ? "Loading rooms..." : "Choose a room..."}
            </option>
            {Array.isArray(rooms) &&
              rooms.map((room: Room) => (
                <option key={room.id} value={room.name}>
                  {room.name} ({room.available_beds.length} beds available)
                </option>
              ))}
          </Select>
        </div>
      )}

      {/* Bedspace Selection */}
      {selectedRoom && selectedRoomData && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Bedspace
          </label>
          <Select
            value={selectedBedspace}
            onChange={(e) => setBedspace(e.target.value)}
          >
            <option value="">Choose a bedspace...</option>
            {selectedRoomData.available_beds.map((bed: string) => (
              <option key={bed} value={bed}>
                {bed}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Selection Summary */}
      {canConfirm && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h4 className="font-medium text-green-800 mb-2">
            Selection Summary:
          </h4>
          <p className="text-green-700">
            <strong>Block:</strong> {selectedBlock}
            <br />
            <strong>Room:</strong> {selectedRoom}
            <br />
            <strong>Bedspace:</strong> {selectedBedspace}
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <LoadingButton
        onClick={handleConfirmSelection}
        disabled={!canConfirm}
        className="w-full"
      >
        Confirm Selection
      </LoadingButton>
    </div>
  );
}
