"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { Room } from "@/shared/store/appStore";

interface NewRoom {
  name: string;
  block: string;
  total_beds: number;
}

export function useRoomsManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState<NewRoom>({
    name: "",
    block: "",
    total_beds: 4,
  });

  const toast = useToast();

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
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to add room");
      }
    } catch (error) {
      toast.error("Failed to add room");
    }
  };

  const resetNewRoom = () => {
    setNewRoom({ name: "", block: "", total_beds: 4 });
  };

  return {
    showAddModal,
    setShowAddModal,
    selectedRoom,
    setSelectedRoom,
    newRoom,
    setNewRoom,
    addRoom,
    resetNewRoom,
  };
}
