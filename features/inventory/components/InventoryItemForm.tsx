"use client";

import { useState, useEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface InventoryItemFormProps {
  onCancel?: () => void;
  onSubmitAction: (data: any) => Promise<void>;
}

export function InventoryItemForm({ onCancel, onSubmitAction }: InventoryItemFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "furniture",
    room_id: "",
    assigned_to: "",
    condition: "good",
    price_estimate: "",
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRoomPopoverOpen, setIsRoomPopoverOpen] = useState(false);
  const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const roomsRes = await fetch("/api/rooms?includeFull=true");
        const roomsData = await roomsRes.json();
        if (roomsData.success) {
          setRooms(roomsData.data || []);
        } else {
          console.error("Failed to load rooms:", roomsData.error);
        }
      } catch (error) {
        console.error("Failed to load rooms", error);
      }

      try {
        const studentsRes = await fetch("/api/students");
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          setStudents(studentsData.data || []);
        } else {
          console.error("Failed to load students:", studentsData.error);
        }
      } catch (error) {
        console.error("Failed to load students", error);
      }
    };
    fetchFormData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSubmitAction({
        ...formData,
        room_id: formData.room_id || null,
        assigned_to: formData.assigned_to || null,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create item");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const roomLabel = `${room.block}${String(room.name).replace(room.block, "")}`.toLowerCase();
    return roomLabel.includes(roomSearch.toLowerCase());
  });

  const filteredStudents = students.filter((student) => {
    const searchBase = `${student.first_name} ${student.last_name} ${student.matric_number}`.toLowerCase();
    return searchBase.includes(studentSearch.toLowerCase());
  });

  const selectedRoom = rooms.find((room) => room.id === formData.room_id);
  const selectedStudent = students.find((student) => student.id === formData.assigned_to);
  const selectedRoomLabel = selectedRoom
    ? `${selectedRoom.block}${String(selectedRoom.name).replace(selectedRoom.block, "")}`
    : "General Storage (No Room)";
  const selectedStudentLabel = selectedStudent
    ? `${selectedStudent.first_name} ${selectedStudent.last_name} (${selectedStudent.matric_number})`
    : "Not Assigned";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-2">
      <div className="space-y-1.5">
        <Label htmlFor="name">Item Name <span className="text-red-500">*</span></Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g. Wooden Bunk Bed"
          className="bg-gray-50 border-gray-200 focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors py-2.5 px-3 outline-none"
          >
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="appliance">Appliance</option>
            <option value="plumbing">Plumbing</option>
            <option value="decor">Decor</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="condition">Condition</Label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors py-2.5 px-3 outline-none"
          >
            <option value="good">Good</option>
            <option value="needs_repair">Needs Repair</option>
            <option value="spoilt">Spoilt</option>
            <option value="destroyed">Destroyed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="room_id">Location / Room</Label>
          <Popover open={isRoomPopoverOpen} onOpenChange={setIsRoomPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full min-w-0 justify-between bg-gray-50 border-gray-200 hover:bg-white font-normal"
              >
                <span className="truncate text-left pr-2">{selectedRoomLabel}</span>
                <ChevronsUpDown className="h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-2" align="start">
              <Input
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search room..."
                className="mb-2"
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, room_id: "" }));
                    setIsRoomPopoverOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <span>General Storage (No Room)</span>
                  {!formData.room_id && <Check className="h-4 w-4 text-blue-600" />}
                </button>
                {filteredRooms.map((room) => {
                  const roomLabel = `${room.block}${String(room.name).replace(room.block, "")}`;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, room_id: room.id }));
                        setIsRoomPopoverOpen(false);
                      }}
                      className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      <span>{roomLabel}</span>
                      {formData.room_id === room.id && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  );
                })}
                {filteredRooms.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No rooms found.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor="assigned_to">Responsible Student (Optional)</Label>
          <Popover open={isStudentPopoverOpen} onOpenChange={setIsStudentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full min-w-0 justify-between bg-gray-50 border-gray-200 hover:bg-white font-normal"
              >
                <span className="truncate text-left pr-2">{selectedStudentLabel}</span>
                <ChevronsUpDown className="h-4 w-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-2" align="start">
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student name or matric number..."
                className="mb-2"
              />
              <div className="max-h-64 overflow-y-auto space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, assigned_to: "" }));
                    setIsStudentPopoverOpen(false);
                  }}
                  className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <span>Not Assigned</span>
                  {!formData.assigned_to && <Check className="h-4 w-4 text-blue-600" />}
                </button>
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, assigned_to: student.id }));
                      setIsStudentPopoverOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                  >
                    <span>
                      {student.first_name} {student.last_name}
                      <span className="text-gray-500"> ({student.matric_number})</span>
                    </span>
                    {formData.assigned_to === student.id && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No students found.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="price_estimate">Price Estimate (₦)</Label>
          <Input
            id="price_estimate"
            name="price_estimate"
            type="number"
            min="0"
            step="100"
            value={formData.price_estimate}
            onChange={handleChange}
            placeholder="0"
            className="bg-gray-50 border-gray-200 focus:bg-white"
          />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full px-6 text-gray-600">
            Cancel
          </Button>
        )}
        <LoadingButton type="submit" isLoading={isLoading} className="rounded-full px-6">
          Add Item
        </LoadingButton>
      </div>
    </form>
  );
}
