"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Modal } from "@/shared/components/ui/modal";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useAppStore, Room, Student } from "@/shared/store/appStore";
import { useRooms, useStudents } from "@/shared/hooks/useAppData";
import { useToast } from "@/shared/hooks/useToast";

function RoomsStats({
  rooms,
  students,
}: {
  rooms: Room[];
  students: Student[];
}) {
  const getOccupancyStats = () => {
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);

    // Calculate occupied beds by counting students with bed assignments
    const occupiedBeds = students.filter(
      (student) => student.block && student.room && student.bedspace_label
    ).length;

    // Available beds = total beds - occupied beds
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
  };

  const stats = getOccupancyStats();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-4 lg:mb-6">
      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Rooms</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalRooms}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Beds</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.totalBeds}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Occupied Beds</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.occupiedBeds}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Available Beds</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.availableBeds}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.occupancyRate}%
            </p>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}

function RoomsManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: "",
    block: "",
    total_beds: 4,
  });

  // Use store and hooks instead of local state
  const { rooms, students } = useAppStore();
  const {
    data: roomsData,
    isLoading: roomsLoading,
    error: roomsError,
  } = useRooms();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useStudents();
  const toast = useToast();

  const isLoading = roomsLoading || studentsLoading;
  const isError = roomsError || studentsError;

  const addRoom = async () => {
    if (!newRoom.name || !newRoom.block) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRoom),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Room added successfully");
        setShowAddModal(false);
        setNewRoom({ name: "", block: "", total_beds: 4 });
        // Refresh data
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to add room");
      }
    } catch (error) {
      toast.error("Failed to add room");
    }
  };

  const getStudentInBed = (
    block: string,
    roomName: string,
    bedLabel: string
  ) => {
    return students.find(
      (student) =>
        (student as any).block === block &&
        (student as any).room === roomName &&
        (student as any).bedspace_label === bedLabel
    );
  };

  const getBedStatus = (room: Room, bedIndex: number) => {
    const bedNumber = bedIndex + 1;

    // Check availability for each position directly from database
    const topBedLabel = `Bed ${bedNumber} (Top)`;
    const downBedLabel = `Bed ${bedNumber} (Down)`;

    const isTopAvailable = room.available_beds.includes(topBedLabel);
    const isDownAvailable = room.available_beds.includes(downBedLabel);

    // Find students in each position
    const studentInTop = getStudentInBed(room.block, room.name, topBedLabel);
    const studentInDown = getStudentInBed(room.block, room.name, downBedLabel);

    return {
      bedNumber,
      topBedLabel,
      downBedLabel,
      isTopAvailable,
      isDownAvailable,
      studentInTop,
      studentInDown,
    };
  };

  if (isLoading) {
    return <CardLoadingSkeleton cards={4} />;
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load rooms data</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <RoomsStats rooms={rooms} students={students} />

      {/* Add Room Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Room Management
          </h2>
          <p className="text-sm text-gray-600">
            Manage hostel rooms and bed assignments
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <CardContainer key={room.id} title={`${room.block} - ${room.name}`}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {room.total_beds} beds total
                </span>
                <span className="text-sm text-gray-600">
                  {room.available_beds.length} available
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Array.from(
                  { length: Math.ceil(room.total_beds / 2) },
                  (_, index) => {
                    const {
                      bedNumber,
                      topBedLabel,
                      downBedLabel,
                      isTopAvailable,
                      isDownAvailable,
                      studentInTop,
                      studentInDown,
                    } = getBedStatus(room, index);

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isTopAvailable || isDownAvailable
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="text-sm font-medium">{topBedLabel}</div>
                        <div className="text-xs text-gray-600">
                          {isTopAvailable ? (
                            <div>
                              <div className="font-medium text-green-600">
                                Available
                              </div>
                              <div className="text-gray-500">Top available</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">
                                {studentInTop?.first_name}{" "}
                                {studentInTop?.last_name}
                              </div>
                              <div className="text-gray-500">
                                {studentInTop?.matric_number}
                              </div>
                              <div className="text-xs text-gray-400">
                                Top bunk
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {downBedLabel}
                        </div>
                        <div className="text-xs text-gray-600">
                          {isDownAvailable ? (
                            <div>
                              <div className="font-medium text-green-600">
                                Available
                              </div>
                              <div className="text-gray-500">
                                Down available
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">
                                {studentInDown?.first_name}{" "}
                                {studentInDown?.last_name}
                              </div>
                              <div className="text-gray-500">
                                {studentInDown?.matric_number}
                              </div>
                              <div className="text-xs text-gray-400">
                                Down bunk
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRoom(room)}
                className="w-full"
              >
                View Details
              </Button>
            </div>
          </CardContainer>
        ))}
      </div>

      {rooms.length === 0 && (
        <EmptyState
          title="No rooms found"
          description="No rooms have been created yet. Add your first room to get started."
        />
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Room"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <Input
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
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
                  setNewRoom({ ...newRoom, block: e.target.value })
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
                  setNewRoom({
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
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={addRoom}>Add Room</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <Modal
          isOpen={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          title={`${selectedRoom.block} - ${selectedRoom.name} Details`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room Name
                </label>
                <p className="text-sm text-gray-900">{selectedRoom.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Block
                </label>
                <p className="text-sm text-gray-900">{selectedRoom.block}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Beds
                </label>
                <p className="text-sm text-gray-900">
                  {selectedRoom.total_beds}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Available Beds
                </label>
                <p className="text-sm text-gray-900">
                  {selectedRoom.available_beds.length}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bed Assignments
              </label>
              <div className="space-y-2">
                {Array.from(
                  { length: Math.ceil(selectedRoom.total_beds / 2) },
                  (_, index) => {
                    const {
                      bedNumber,
                      topBedLabel,
                      downBedLabel,
                      isTopAvailable,
                      isDownAvailable,
                      studentInTop,
                      studentInDown,
                    } = getBedStatus(selectedRoom, index);

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isTopAvailable || isDownAvailable
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{topBedLabel}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isTopAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isTopAvailable ? "Available" : "Occupied"}
                          </span>
                        </div>
                        {isTopAvailable && (
                          <div className="mt-1 text-xs text-gray-500">
                            Top available
                          </div>
                        )}
                        {!isTopAvailable && studentInTop && (
                          <div className="mt-2 text-sm">
                            <div>
                              <strong>Student:</strong>{" "}
                              {studentInTop.first_name} {studentInTop.last_name}
                            </div>
                            <div>
                              <strong>Matric:</strong>{" "}
                              {studentInTop.matric_number}
                            </div>
                            <div>
                              <strong>Phone:</strong> {studentInTop.phone}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              <strong>Position:</strong> Top bunk
                            </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium">{downBedLabel}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isDownAvailable
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isDownAvailable ? "Available" : "Occupied"}
                          </span>
                        </div>
                        {isDownAvailable && (
                          <div className="mt-1 text-xs text-gray-500">
                            Down available
                          </div>
                        )}
                        {!isDownAvailable && studentInDown && (
                          <div className="mt-2 text-sm">
                            <div>
                              <strong>Student:</strong>{" "}
                              {studentInDown.first_name}{" "}
                              {studentInDown.last_name}
                            </div>
                            <div>
                              <strong>Matric:</strong>{" "}
                              {studentInDown.matric_number}
                            </div>
                            <div>
                              <strong>Phone:</strong> {studentInDown.phone}
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
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto space-y-4 lg:space-y-6">
        {/* Page Header */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage hostel rooms and bed assignments.
          </p>
        </div>

        <Suspense fallback={<CardLoadingSkeleton cards={4} />}>
          <RoomsManagement />
        </Suspense>
      </div>
    </div>
  );
}
