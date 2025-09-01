"use client";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Modal } from "@/shared/components/ui/modal";
import { Student } from "@/shared/store/appStore";

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
  if (!student) return null;

  return (
    <Modal
      isOpen={!!student}
      onClose={onClose}
      title={`Edit Student - ${student.first_name} ${student.last_name}`}
    >
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
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
