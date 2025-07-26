"use client";

import { Suspense, useState, useEffect } from "react";
import Header from "@/features/dashboard/components/Header";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Modal } from "@/shared/components/ui/modal";
import { StatsLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { EmptyState } from "@/shared/components/ui/empty-state";

interface Room {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  available_beds: string[];
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  block: string;
  room: string;
  bedspace_label: string;
}

function RoomsStats({ rooms }: { rooms: Room[] }) {
  const getOccupancyStats = () => {
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.total_beds, 0);
    const availableBeds = rooms.reduce(
      (sum, room) => sum + room.available_beds.length,
      0
    );
    const occupiedBeds = totalBeds - availableBeds;
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Occupied</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.occupiedBeds}
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    block: "",
    total_beds: 4,
  });

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsResult, studentsResult] = await Promise.all([
        supabase.from("rooms").select("*").order("block").order("name"),
        supabase
          .from("students")
          .select("id, first_name, last_name, block, room, bedspace_label"),
      ]);

      if (roomsResult.error) throw roomsResult.error;
      if (studentsResult.error) throw studentsResult.error;

      setRooms(roomsResult.data || []);
      setStudents(studentsResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async () => {
    if (!newRoom.name || !newRoom.block) return;

    try {
      const defaultBeds = Array.from({ length: newRoom.total_beds }, (_, i) => {
        const bedNum = Math.floor(i / 2) + 1;
        const position = i % 2 === 0 ? "Top" : "Down";
        return `Bed ${bedNum} (${position})`;
      });

      const { error } = await supabase.from("rooms").insert({
        name: newRoom.name,
        block: newRoom.block,
        total_beds: newRoom.total_beds,
        available_beds: defaultBeds,
      });

      if (error) throw error;

      await fetchData();
      setShowAddRoom(false);
      setNewRoom({ name: "", block: "", total_beds: 4 });
    } catch (error) {
      console.error("Error adding room:", error);
    }
  };

  const filteredRooms = selectedBlock
    ? rooms.filter((room) => room.block === selectedBlock)
    : rooms;

  const blocks = [...new Set(rooms.map((room) => room.block))];

  const getStudentInBed = (
    block: string,
    roomName: string,
    bedLabel: string
  ) => {
    return students.find(
      (student) =>
        student.block === block &&
        student.room === roomName &&
        student.bedspace_label === bedLabel
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsLoadingSkeleton count={4} columns={4} />
        <CardContainer>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </div>
        </CardContainer>
      </div>
    );
  }

  return (
    <>
      <RoomsStats rooms={rooms} />

      {/* Controls */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Block
              </label>
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block} value={block}>
                    {block}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={() => setShowAddRoom(true)}>Add New Room</Button>
        </div>
      </CardContainer>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => {
          const occupiedBeds = room.total_beds - room.available_beds.length;
          // Generate bed labels based on room's total_beds (4 or 6)
          const allBeds = Array.from({ length: room.total_beds }, (_, i) => {
            const bedNum = Math.floor(i / 2) + 1;
            const position = i % 2 === 0 ? "Top" : "Down";
            return `Bed ${bedNum} (${position})`;
          });

          return (
            <CardContainer key={room.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.block} - {room.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {occupiedBeds}/{room.total_beds} beds occupied
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">Available</span>
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-gray-500">Occupied</span>
                </div>
              </div>

              {/* Bed Layout Visualization */}
              <div
                className={`grid gap-2 mb-4 ${room.total_beds === 6 ? "grid-cols-3" : "grid-cols-2"}`}
              >
                {allBeds.map((bedLabel, index) => {
                  const isAvailable = room.available_beds.includes(bedLabel);
                  const student = !isAvailable
                    ? getStudentInBed(room.block, room.name, bedLabel)
                    : null;

                  return (
                    <div
                      key={bedLabel}
                      className={`p-3 rounded-lg border-2 text-center ${
                        isAvailable
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {bedLabel}
                      </div>
                      {student && (
                        <div className="text-xs text-gray-600">
                          {student.first_name} {student.last_name}
                        </div>
                      )}
                      <div
                        className={`text-xs font-medium ${
                          isAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isAvailable ? "Available" : "Occupied"}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(occupiedBeds / room.total_beds) * 100}%`,
                  }}
                ></div>
              </div>
            </CardContainer>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <EmptyState
          icon={
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a2 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          title="No rooms found"
          description={
            selectedBlock
              ? `No rooms found in ${selectedBlock} block.`
              : "No rooms have been created yet."
          }
        />
      )}

      {/* Add Room Modal */}
      <Modal
        isOpen={showAddRoom}
        onClose={() => setShowAddRoom(false)}
        title="Add New Room"
        description="Create a new room with specified number of beds"
        size="sm"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowAddRoom(false)}>
              Cancel
            </Button>
            <Button onClick={addRoom}>Add Room</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <Input
              placeholder="e.g., Room 101"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block
            </label>
            <Input
              placeholder="e.g., Block A"
              value={newRoom.block}
              onChange={(e) =>
                setNewRoom({ ...newRoom, block: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Beds
            </label>
            <select
              value={newRoom.total_beds}
              onChange={(e) =>
                setNewRoom({ ...newRoom, total_beds: parseInt(e.target.value) })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value={2}>2 Beds</option>
              <option value={4}>4 Beds</option>
              <option value={6}>6 Beds</option>
              <option value={8}>8 Beds</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function RoomsPage() {
  return (
    <>
      <Header
        title="Rooms Management"
        subtitle="Manage rooms, beds, and track occupancy"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="space-y-6">
                <StatsLoadingSkeleton count={4} columns={4} />
                <CardContainer>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-64 bg-gray-200 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  </div>
                </CardContainer>
              </div>
            }
          >
            <RoomsManagement />
          </Suspense>
        </div>
      </div>
    </>
  );
}
