"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Button } from "@/shared/components/ui/button";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useAppStore } from "@/shared/store/appStore";
import { useRooms, useStudents } from "@/shared/hooks/useAppData";
import { useRoomsManagement } from "./hooks/useRoomsManagement";
import { RoomsStats } from "./components/RoomsStats";
import { RoomCard } from "./components/RoomCard";
import { AddRoomModal } from "./components/AddRoomModal";
import { RoomDetailsModal } from "./components/RoomDetailsModal";

function RoomsManagement() {
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

  const {
    showAddModal,
    setShowAddModal,
    selectedRoom,
    setSelectedRoom,
    newRoom,
    setNewRoom,
    addRoom,
  } = useRoomsManagement();

  const isLoading = roomsLoading || studentsLoading;
  const isError = roomsError || studentsError;

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
      <RoomsStats rooms={rooms} students={students} />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            students={students}
            onViewDetails={setSelectedRoom}
          />
        ))}
      </div>

      {rooms.length === 0 && (
        <EmptyState
          title="No rooms found"
          description="No rooms have been created yet. Add your first room to get started."
        />
      )}

      <AddRoomModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        newRoom={newRoom}
        onNewRoomChange={setNewRoom}
        onAddRoom={addRoom}
      />

      <RoomDetailsModal
        room={selectedRoom}
        students={students}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
}

export default function RoomsPage() {
  return (
    <div className="p-4 lg:p-6 pb-8 lg:pb-12">
      <div className="mx-auto space-y-4 lg:space-y-6">
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
