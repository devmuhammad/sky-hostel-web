import { useState, useEffect } from "react";

interface RoomData {
  id: string;
  name: string;
  block: string;
  total_beds: number;
  bed_type: string;
  available_beds: string[];
}

interface UseRoomsDataReturn {
  rooms: RoomData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRoomsData(): UseRoomsDataReturn {
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rooms");
      const result = await response.json();

      if (result.success) {
        setRooms(result.data || []);
      } else {
        setError(result.error?.message || "Failed to fetch rooms");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  return {
    rooms,
    loading,
    error,
    refetch: fetchRooms,
  };
}
