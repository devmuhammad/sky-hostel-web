"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { useRoomsData } from "@/shared/hooks/useRoomsData";

interface RoomType {
  id: string;
  name: string;
  capacity: number;
  price: number;
  color: string;
}

interface Room {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  bed_type: string;
  available_beds: string[];
}

interface Bedspace {
  id: string;
  bunk: string;
  position: "top" | "bottom";
  available: boolean;
  label?: string;
  weightRestriction?: string;
}

interface RoomSelectionWizardProps {
  onComplete: (selection: {
    block: string;
    room: string;
    bedspace: string;
    roomId: string;
  }) => void;
  onBack: () => void;
  studentData?: {
    weight: number;
    [key: string]: any;
  };
}

const ROOM_TYPES: RoomType[] = [
  {
    id: "room-4",
    name: "ROOM OF 4",
    capacity: 4,
    price: 219000,
    color: "bg-green-500",
  },
  {
    id: "room-6",
    name: "ROOM OF 6",
    capacity: 6,
    price: 219000,
    color: "bg-blue-500",
  },
];

export function RoomSelectionWizard({
  onComplete,
  onBack,
  studentData,
}: RoomSelectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(
    null
  );
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedBedspace, setSelectedBedspace] = useState<Bedspace | null>(
    null
  );
  const [selectedBlock, setSelectedBlock] = useState<string>("all");

  // Fetch real room data from database with auto-refresh
  const { rooms: databaseRooms, loading, error, refetch } = useRoomsData();

  // Auto-refresh room data every 30 seconds to prevent stale data
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Filter available rooms (rooms with available beds)
  const availableRooms = databaseRooms.filter(
    (room) => room.available_beds.length > 0
  );
  const availableRoomsCount = availableRooms.length;

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room availability...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Rooms
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const handleRoomTypeSelect = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setCurrentStep(2);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    setCurrentStep(3);
  };

  const handleBedspaceSelect = (bedspace: Bedspace) => {
    setSelectedBedspace(bedspace);
  };

  const handleContinue = () => {
    if (!selectedBedspace || !selectedRoom) return;

    // Map UI bedspace selection to database format
    const is6BedRoom = selectedRoom.bed_type === "6_bed";

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

    const bedspaceLabel =
      bunkMapping[selectedBedspace.bunk as keyof typeof bunkMapping]?.[
        selectedBedspace.position
      ];

    if (!bedspaceLabel) {
      return;
    }

    onComplete({
      block: selectedRoom.block,
      room: selectedRoom.name,
      bedspace: bedspaceLabel,
      roomId: selectedRoom.id,
    });
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 2) {
        setSelectedRoom(null);
        setSelectedBedspace(null);
      } else if (currentStep === 3) {
        setSelectedBedspace(null);
      }
    } else {
      onBack();
    }
  };

  // Step 1: Room Type Selection
  if (currentStep === 1) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Availability Notice */}
        <div className="mb-6 p-3 bg-gray-100 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700">
              {availableRoomsCount} rooms available with at least 2 spaces left
            </span>
          </div>
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Refresh Availability
          </Button>
        </div>

        {/* Room Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {ROOM_TYPES.map((roomType) => (
            <div
              key={roomType.id}
              className={`${roomType.color} text-white p-6 rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => handleRoomTypeSelect(roomType)}
            >
              <h3 className="text-2xl font-bold mb-4">{roomType.name}</h3>
              <div className="text-3xl font-bold mb-4">
                NGN {roomType.price.toLocaleString()}
              </div>
              <div className="space-y-2 text-sm">
                <div>Hostel Fee - 180,000</div>
                <div>Utility Fee - 28,000</div>
                <div>Caution Fee - 10,000</div>
                <div>Form Fee - 1,000</div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>
    );
  }

  // Step 2: Room Selection
  if (currentStep === 2) {
    // Filter rooms by bed type (4_bed or 6_bed)
    const bedTypeFilter = selectedRoomType?.id === "room-4" ? "4_bed" : "6_bed";
    const filteredRooms = databaseRooms.filter(
      (room) => room.bed_type === bedTypeFilter
    );

    // Get unique blocks for the selected room type
    const availableBlocks = [
      ...new Set(filteredRooms.map((room) => room.block)),
    ].sort();

    // Filter rooms by selected block
    const blockFilteredRooms =
      selectedBlock === "all"
        ? filteredRooms
        : filteredRooms.filter((room) => room.block === selectedBlock);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">ROOM SELECTION</h2>
        <p className="text-gray-600 mb-6">Please select your preferred room</p>

        {/* Block Filter */}
        <div className="mb-6">
          <label
            htmlFor="block-filter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Filter by Block
          </label>
          <select
            id="block-filter"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Blocks</option>
            {availableBlocks.map((block) => (
              <option key={block} value={block}>
                Block {block}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {ROOM_TYPES.map((roomType) => {
            // Filter rooms by bed type
            const bedTypeFilter = roomType.id === "room-4" ? "4_bed" : "6_bed";
            const typeRooms = blockFilteredRooms.filter(
              (room) => room.bed_type === bedTypeFilter
            );

            return (
              <div key={roomType.id} className="border rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold">{roomType.name}</h3>
                  <span className="ml-2 text-sm text-gray-500">
                    ({typeRooms.length} rooms)
                  </span>
                </div>

                {typeRooms.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No rooms available in selected block
                  </p>
                ) : (
                  <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                    {typeRooms.map((room) => {
                      const isAvailable = room.available_beds.length > 0;
                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomSelect(room)}
                          disabled={!isAvailable}
                          className={`p-2 text-sm rounded border transition-colors ${
                            isAvailable
                              ? "bg-white border-blue-500 text-blue-600 hover:bg-blue-50"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {room.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <div className="w-24"></div> {/* Spacer */}
        </div>
      </div>
    );
  }

  // Step 3: Bedspace Selection
  if (currentStep === 3 && selectedRoom) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-2">BEDSPACES</h2>
        <p className="text-gray-600 mb-6">
          Please select your preferred bed space for Room {selectedRoom.name}
        </p>

        {/* Available Beds from Database */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">
            Available Bed Spaces
          </h3>
          <p className="text-sm text-blue-700">
            {selectedRoom.available_beds.length > 0
              ? selectedRoom.available_beds.length
              : 3}{" "}
            bed(s) available in this room
          </p>
          <p className="text-xs text-blue-600 mt-2">
            Available beds:{" "}
            {selectedRoom.available_beds.length > 0
              ? selectedRoom.available_beds.join(", ")
              : "Bed 1 (Top), Bed 1 (Down), Bed 2 (Top) (Demo Data)"}
          </p>
        </div>

        {/* Weight Restriction Notice */}
        {studentData?.weight && studentData.weight > 60 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">
              ⚠️ Weight Restriction Notice
            </h3>
            <p className="text-sm text-yellow-700">
              Your weight is <strong>{studentData.weight}kg</strong>, which
              exceeds the 60kg limit for top bunks.
            </p>
            <p className="text-xs text-yellow-600 mt-2">
              For safety reasons, you can only select bottom bunks. Top bunks
              are restricted to students weighing 60kg or less.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {(selectedRoom.bed_type === "6_bed"
            ? ["Bunk A", "Bunk B", "Bunk C"]
            : ["Bunk A", "Bunk B"]
          ).map((bunkName) => {
            // Create bedspace options based on available beds
            // Map bunk names to database bed labels
            const is6BedRoom = selectedRoom.bed_type === "6_bed";

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

            // For demo purposes, if no database data, make some beds available
            const demoAvailableBeds =
              selectedRoom.available_beds.length === 0
                ? ["Bed 1 (Top)", "Bed 1 (Down)", "Bed 2 (Top)"]
                : selectedRoom.available_beds;

            const bunkBedspaces = [
              {
                id: `${bunkName}-top`,
                bunk: bunkName,
                position: "top" as const,
                available:
                  demoAvailableBeds.includes(
                    bunkMapping[bunkName as keyof typeof bunkMapping]?.top || ""
                  ) &&
                  (!studentData?.weight || studentData.weight <= 60),
                label: `${bunkName} Top Bunk`,
                weightRestriction:
                  studentData?.weight && studentData.weight > 60
                    ? `⚠️ Top bunk restricted for students >60kg (Your weight: ${studentData.weight}kg)`
                    : undefined,
              },
              {
                id: `${bunkName}-bottom`,
                bunk: bunkName,
                position: "bottom" as const,
                available: demoAvailableBeds.includes(
                  bunkMapping[bunkName as keyof typeof bunkMapping]?.bottom ||
                    ""
                ),
                label: `${bunkName} Bottom Bunk`,
                weightRestriction: undefined,
              },
            ];

            return (
              <div key={bunkName} className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{bunkName}</h3>
                <div className="relative">
                  {/* Bunk Bed Image Placeholder */}
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center relative">
                    <div className="text-gray-500">Bunk Bed Image</div>

                    {/* Bed Numbers - positioned over the image only */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                      <div className="flex justify-center">
                        <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-semibold">
                          1
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-semibold">
                          2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bedspace Selection */}
                  <div className="grid grid-cols-2 gap-2 relative z-10">
                    {bunkBedspaces.map((bedspace) => (
                      <button
                        key={bedspace.id}
                        onClick={() => handleBedspaceSelect(bedspace)}
                        disabled={!bedspace.available}
                        className={`p-3 text-sm rounded border transition-colors ${
                          selectedBedspace?.id === bedspace.id
                            ? "bg-blue-500 border-blue-500 text-white font-semibold"
                            : bedspace.available
                              ? "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <div className="text-center">
                          <div>
                            {bedspace.position === "top"
                              ? "Top Bunk"
                              : "Bottom Bunk"}
                          </div>
                          {bedspace.weightRestriction && (
                            <div className="text-xs text-red-600 mt-1">
                              {bedspace.weightRestriction}
                            </div>
                          )}
                          {selectedBedspace?.id === bedspace.id && (
                            <span className="ml-1">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleContinue} disabled={!selectedBedspace}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
