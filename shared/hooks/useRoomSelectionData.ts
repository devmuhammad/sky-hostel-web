import { useState, useEffect } from "react";

interface RoomData {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  bed_type: string;
  available_beds: string[];
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  matric_number: string;
  block: string;
  room: string;
  bedspace_label: string;
  [key: string]: any;
}

interface UseRoomSelectionDataReturn {
  rooms: RoomData[];
  students: StudentData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoomSelectionData(): UseRoomSelectionDataReturn {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch rooms and students in parallel
      const [roomsResponse, studentsResponse] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/students"),
      ]);

      const roomsResult = await roomsResponse.json();
      const studentsResult = await studentsResponse.json();

      if (roomsResult.success) {
        setRooms(roomsResult.data || []);
      } else {
        throw new Error(roomsResult.error?.message || "Failed to fetch rooms");
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data || []);
      } else {
        throw new Error(
          studentsResult.error?.message || "Failed to fetch students"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    rooms,
    students,
    loading,
    error,
    refetch: fetchData,
  };
}
