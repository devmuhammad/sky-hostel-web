"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { CardLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Modal } from "@/shared/components/ui/modal";
import { useRooms, useStudents } from "@/shared/hooks/useAppData";
import { Room } from "@/shared/store/appStore";
import { useRoomsManagement } from "./hooks/useRoomsManagement";
import { RoomsStats } from "./components/RoomsStats";
import { RoomCard } from "./components/RoomCard";
import { AddRoomModal } from "./components/AddRoomModal";
import { RoomDetailsModal } from "./components/RoomDetailsModal";
import { roomHasReservations } from "./utils/roomUtils";
import { toast } from "sonner";

function RoomsManagement() {
  const [activeTab, setActiveTab] = useState<"all" | "locked" | "reserved">(
    "all"
  );
  const [statusUpdating, setStatusUpdating] = useState<{
    roomId: string | null;
    status: "open" | "locked" | null;
  }>({ roomId: null, status: null });
  const [reservationTarget, setReservationTarget] = useState<{
    room: Room;
    bedspaceLabel: string;
  } | null>(null);
  const [reservationName, setReservationName] = useState("");
  const [reservationBusyLabel, setReservationBusyLabel] = useState<
    string | null
  >(null);

  const {
    data: roomsData,
    isLoading: roomsLoading,
    error: roomsError,
    refetch: refetchRooms,
  } = useRooms();
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useStudents();

  const rooms = useMemo(() => roomsData || [], [roomsData]);
  const students = useMemo(() => studentsData || [], [studentsData]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/admin/rooms/reconcile-availability", {
          method: "POST",
        });
        if (!cancelled && response.ok) {
          await refetchRooms();
        }
      } catch (error) {
        console.error("Room availability reconcile failed:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchRooms]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchRooms();
      refetchStudents();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchRooms, refetchStudents]);

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
  const reservedRooms = useMemo(
    () => rooms.filter((room) => roomHasReservations(room)),
    [rooms]
  );
  const lockedRooms = useMemo(
    () =>
      rooms.filter(
        (room) => (room.room_availability_status || "open") === "locked"
      ),
    [rooms]
  );
  const visibleRooms = useMemo(() => {
    if (activeTab === "locked") return lockedRooms;
    if (activeTab === "reserved") return reservedRooms;
    return rooms;
  }, [activeTab, lockedRooms, reservedRooms, rooms]);

  const setRoomAvailabilityStatus = async (
    room: Room,
    status: "open" | "locked"
  ) => {
    try {
      setStatusUpdating({ roomId: room.id, status });
      const response = await fetch(`/api/admin/rooms/${room.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update room status");
      }

      toast.success(
        `${room.block}-${room.name} set to ${status === "open" ? "Open" : "Locked"}`
      );
      await refetchRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to update room availability");
    } finally {
      setStatusUpdating({ roomId: null, status: null });
    }
  };

  const saveReservation = async () => {
    if (!reservationTarget) return;
    const name = reservationName.trim();
    if (!name) {
      toast.error("Enter the name of the person this bedspace is reserved for");
      return;
    }

    const busyKey = `${reservationTarget.room.id}:${reservationTarget.bedspaceLabel}`;
    setReservationBusyLabel(busyKey);
    try {
      const response = await fetch(
        `/api/admin/rooms/${reservationTarget.room.id}/reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bedspace_label: reservationTarget.bedspaceLabel,
            reserved_for_name: name,
          }),
        }
      );
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to reserve bedspace");
      }
      toast.success(
        `${reservationTarget.bedspaceLabel} reserved for ${name}`
      );
      setReservationTarget(null);
      setReservationName("");
      await refetchRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to reserve bedspace");
    } finally {
      setReservationBusyLabel(null);
    }
  };

  const cancelReservation = async (room: Room, bedspaceLabel: string) => {
    const busyKey = `${room.id}:${bedspaceLabel}`;
    setReservationBusyLabel(busyKey);
    try {
      const response = await fetch(`/api/admin/rooms/${room.id}/reservations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedspace_label: bedspaceLabel }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to cancel reservation");
      }
      toast.success(`${bedspaceLabel} is available again`);
      await refetchRooms();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel reservation");
    } finally {
      setReservationBusyLabel(null);
    }
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

      <div className="border-b border-gray-200">
        <nav className="flex gap-2">
          {[
            { key: "all" as const, label: `All (${rooms.length})` },
            { key: "locked" as const, label: `Locked (${lockedRooms.length})` },
            {
              key: "reserved" as const,
              label: `Reserved (${reservedRooms.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border border-b-white border-gray-200 bg-white text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "all" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          Full rooms lock automatically. Rooms with free bedspaces stay{" "}
          <span className="font-semibold">Open</span>. Reserve a specific
          bedspace with the person&apos;s name so remaining spaces stay
          selectable.
        </div>
      )}

      {visibleRooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              students={students}
              onViewDetails={setSelectedRoom}
              onSetAvailabilityStatus={setRoomAvailabilityStatus}
              onReserveBed={(targetRoom, bedspaceLabel) => {
                setReservationName("");
                setReservationTarget({ room: targetRoom, bedspaceLabel });
              }}
              onCancelReservation={cancelReservation}
              isStatusUpdating={statusUpdating.roomId === room.id}
              statusUpdatingTo={
                statusUpdating.roomId === room.id ? statusUpdating.status : null
              }
              reservationBusyLabel={reservationBusyLabel}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${activeTab} rooms found`}
          description={
            activeTab === "all"
              ? "No rooms available yet. Add a new room to get started."
              : activeTab === "reserved"
                ? "No bedspaces are reserved right now."
                : "There are no locked rooms right now."
          }
          action={
            <Button onClick={() => setShowAddModal(true)}>Add Room</Button>
          }
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

      <Modal
        isOpen={!!reservationTarget}
        onClose={() => {
          if (reservationBusyLabel) return;
          setReservationTarget(null);
          setReservationName("");
        }}
        title="Reserve bedspace"
        hideDefaultFooter
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {reservationTarget
              ? `${reservationTarget.room.block} - ${reservationTarget.room.name} · ${reservationTarget.bedspaceLabel}`
              : ""}
          </p>
          <div>
            <Label htmlFor="reserved_for_name">Reserved for</Label>
            <Input
              id="reserved_for_name"
              value={reservationName}
              onChange={(event) => setReservationName(event.target.value)}
              placeholder="Full name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReservationTarget(null);
                setReservationName("");
              }}
              disabled={Boolean(reservationBusyLabel)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveReservation}
              disabled={Boolean(reservationBusyLabel)}
            >
              {reservationBusyLabel ? "Saving..." : "Reserve bedspace"}
            </Button>
          </div>
        </div>
      </Modal>
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
