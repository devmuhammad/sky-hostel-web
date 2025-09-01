"use client";

import { CardContainer } from "@/shared/components/ui/card-container";
import { Room, Student } from "@/shared/store/appStore";
import { getOccupancyStats } from "../utils/roomUtils";

interface RoomsStatsProps {
  rooms: Room[];
  students: Student[];
}

export function RoomsStats({ rooms, students }: RoomsStatsProps) {
  const stats = getOccupancyStats(rooms, students);

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
