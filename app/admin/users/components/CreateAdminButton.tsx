"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import CreateAdminModal from "./CreateAdminModal";

interface CreateAdminButtonProps {
  currentUserRole: string;
}

export default function CreateAdminButton({ currentUserRole }: CreateAdminButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
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
        Add Staff User
      </Button>
      <CreateAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        currentUserRole={currentUserRole}
      />
    </>
  );
}