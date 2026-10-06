"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Modal } from "@/shared/components/ui/modal";
import { RoomSelectionWizard } from "@/shared/components/ui/room-selection-wizard";
import { Student, useAppStore } from "@/shared/store/appStore";
import { useToast } from "@/shared/hooks/useToast";

interface EditStudentForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  address: string;
  state_of_origin: string;
  [key: string]: string;
}

interface EditStudentModalProps {
  student: Student | null;
  editForm: EditStudentForm;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onClose: () => void;
  isPending: boolean;
}

export function EditStudentModal({
  student,
  editForm,
  onInputChange,
  onSave,
  onClose,
  isPending,
}: EditStudentModalProps) {
  const toast = useToast();
  const { updateStudent, students } = useAppStore();
  const [role, setRole] = useState<string | null>(null);
  const [showRoomWizard, setShowRoomWizard] = useState(false);
  const [isChangingRoom, setIsChangingRoom] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users/me");
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setRole(json.data?.role || null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setShowRoomWizard(false);
    setIsChangingRoom(false);
  }, [student?.id]);

  const liveStudent =
    (student && students.find((s) => s.id === student.id)) || student;

  if (!liveStudent) return null;

  const isSuperAdmin = role === "super_admin";
  const isBlacklisted =
    liveStudent.is_active === false ||
    liveStudent.account_status === "blacklisted";

  const handleChangeRoom = async (selection: {
    block: string;
    room: string;
    bedspace: string;
    roomId: string;
  }) => {
    setIsChangingRoom(true);
    try {
      const res = await fetch(
        `/api/admin/students/${liveStudent.id}/change-room`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            block: selection.block,
            room: selection.room,
            bedspace_label: selection.bedspace,
            room_id: selection.roomId,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to change room");
      }

      if (json.data?.student) {
        updateStudent(liveStudent.id, json.data.student);
      }
      toast.success(json.data?.message || "Room assignment updated");
      setShowRoomWizard(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to change room");
    } finally {
      setIsChangingRoom(false);
    }
  };

  const handleClose = () => {
    if (isChangingRoom || isPending) return;
    setShowRoomWizard(false);
    onClose();
  };

  return (
    <Modal
      isOpen={!!student}
      onClose={handleClose}
      title={`Edit Student - ${liveStudent.first_name} ${liveStudent.last_name}`}
      size={showRoomWizard ? "xl" : "md"}
      hideDefaultFooter
    >
      {showRoomWizard ? (
        isChangingRoom ? (
          <div className="py-12 text-center text-sm text-slate-600">
            Updating room assignment…
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {liveStudent.block && liveStudent.room
                ? `Current: Block ${liveStudent.block} Room ${liveStudent.room} · ${liveStudent.bedspace_label || "N/A"}`
                : "Student has no current room assignment."}
            </p>
            <RoomSelectionWizard
              onComplete={handleChangeRoom}
              onBack={() => setShowRoomWizard(false)}
              studentData={{ weight: liveStudent.weight }}
              excludeStudentId={liveStudent.id}
              confirmLabel="Save new room"
            />
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={editForm.first_name}
                onChange={onInputChange}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={editForm.last_name}
                onChange={onInputChange}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={editForm.email}
              onChange={onInputChange}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={editForm.phone}
              onChange={onInputChange}
            />
          </div>
          <div>
            <Label htmlFor="matric_number">Matric Number</Label>
            <Input
              id="matric_number"
              name="matric_number"
              value={editForm.matric_number}
              onChange={onInputChange}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={editForm.address}
              onChange={onInputChange}
            />
          </div>
          <div>
            <Label htmlFor="state_of_origin">State of Origin</Label>
            <Input
              id="state_of_origin"
              name="state_of_origin"
              value={editForm.state_of_origin}
              onChange={onInputChange}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            <p className="text-sm font-medium text-slate-900">Room / bunk</p>
            <p className="mt-1 text-sm text-slate-600">
              {liveStudent.block && liveStudent.room
                ? `Block ${liveStudent.block} · Room ${liveStudent.room} · ${liveStudent.bedspace_label || "N/A"}`
                : "No room assigned"}
            </p>
            {isSuperAdmin && !isBlacklisted ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setShowRoomWizard(true)}
              >
                Change room / bunk
              </Button>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                {isBlacklisted
                  ? "Room cannot be changed for blacklisted students."
                  : "Only super admins can change room / bunk."}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
