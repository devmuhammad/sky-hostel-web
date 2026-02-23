"use client";

import { useState, useEffect, useMemo } from "react";
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

interface InventoryCategory {
  id: string;
  name: string;
  slug: string;
  is_room_template: boolean;
}

interface RoomTemplate {
  id: string;
  expected_quantity: number;
  category: InventoryCategory;
}

export function InventoryItemForm({ onCancel, onSubmitAction }: InventoryItemFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    custom_category: "",
    room_id: "",
    assigned_to: "",
    condition: "good",
    price_estimate: "",
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [roomTemplates, setRoomTemplates] = useState<RoomTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRoomPopoverOpen, setIsRoomPopoverOpen] = useState(false);
  const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false);
  const [roomSearch, setRoomSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [roomsRes, studentsRes, categoriesRes] = await Promise.all([
          fetch("/api/rooms?includeFull=true"),
          fetch("/api/students"),
          fetch("/api/admin/inventory/categories"),
        ]);

        const [roomsData, studentsData, categoriesData] = await Promise.all([
          roomsRes.json(),
          studentsRes.json(),
          categoriesRes.json(),
        ]);

        if (roomsData.success) {
          setRooms(roomsData.data || []);
        }

        if (studentsData.success) {
          setStudents(studentsData.data || []);
        }

        if (categoriesData.success) {
          const loadedCategories = categoriesData.data?.categories || [];
          setCategories(loadedCategories);
          if (loadedCategories.length > 0) {
            setFormData((prev) => ({ ...prev, category_id: loadedCategories[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to load inventory form data", error);
      }
    };

    fetchFormData();
  }, []);

  useEffect(() => {
    const fetchRoomTemplates = async () => {
      if (!formData.room_id) {
        setRoomTemplates([]);
        return;
      }

      try {
        const res = await fetch(`/api/admin/inventory/room-categories?roomId=${formData.room_id}`);
        const data = await res.json();
        if (!data.success) return;

        const templates = (data.data || []) as RoomTemplate[];
        setRoomTemplates(templates);

        if (templates.length > 0) {
          const selectedTemplateExists = templates.some((template) => template.category?.id === formData.category_id);
          if (!selectedTemplateExists && !formData.custom_category) {
            setFormData((prev) => ({ ...prev, category_id: templates[0].category.id }));
          }
        }
      } catch (error) {
        console.error("Failed to load room templates", error);
      }
    };

    fetchRoomTemplates();
  }, [formData.room_id]);

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
        category: formData.custom_category.trim() || undefined,
        category_id: formData.custom_category.trim() ? null : formData.category_id,
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

  const activeCategories = useMemo(() => {
    if (roomTemplates.length === 0) {
      return categories;
    }

    const roomTemplateCategoryIds = new Set(roomTemplates.map((template) => template.category.id));
    const roomTemplateCategories = categories.filter((category) => roomTemplateCategoryIds.has(category.id));
    const nonTemplateCategories = categories.filter((category) => !roomTemplateCategoryIds.has(category.id));

    return [...roomTemplateCategories, ...nonTemplateCategories];
  }, [categories, roomTemplates]);

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
          <Label htmlFor="category_id">Category</Label>
          <select
            id="category_id"
            name="category_id"
            value={formData.custom_category ? "custom" : formData.category_id}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "custom") {
                setFormData((prev) => ({ ...prev, custom_category: "", category_id: "" }));
                return;
              }
              setFormData((prev) => ({ ...prev, category_id: value, custom_category: "" }));
            }}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors py-2.5 px-3 outline-none"
          >
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value="custom">Custom Category</option>
          </select>

          {formData.custom_category !== "" && (
            <Input
              id="custom_category"
              name="custom_category"
              value={formData.custom_category}
              onChange={handleChange}
              placeholder="Enter custom category"
              className="mt-2 bg-gray-50 border-gray-200 focus:bg-white"
              required
            />
          )}

          {roomTemplates.length > 0 && (
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
              This room has {roomTemplates.length} attached inventory category template(s).
            </p>
          )}
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
