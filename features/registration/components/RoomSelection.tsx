"use client";

import { RoomSelectionWizard } from "@/shared/components/ui";

interface RoomSelectionProps {
  onRoomSelected: (selection: {
    block: string;
    room: string;
    bedspace: string;
    roomId: string;
  }) => void;
  onBack: () => void;
  studentData: any;
}

export default function RoomSelection({
  onRoomSelected,
  onBack,
  studentData,
}: RoomSelectionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <RoomSelectionWizard
        onComplete={onRoomSelected}
        onBack={onBack}
        studentData={studentData}
      />
    </div>
  );
}
