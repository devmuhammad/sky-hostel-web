"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LeaveRequestFormProps {
  onSubmitAction: (data: any) => Promise<void>;
  onCancel?: () => void;
  staffId: string;
}

export function LeaveRequestForm({ onSubmitAction, onCancel, staffId }: LeaveRequestFormProps) {
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateValue = (value: string) => {
    if (!value) return undefined;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date().toISOString().split("T")[0];
  const todayDate = parseDateValue(today)!;
  const selectedStartDate = parseDateValue(formData.start_date);
  const selectedEndDate = parseDateValue(formData.end_date);

  const setStartDate = (date?: Date) => {
    if (!date) return;
    const nextStartDate = toDateInputValue(date);
    setFormData((prev) => {
      const nextState = { ...prev, start_date: nextStartDate };
      if (nextState.end_date && nextState.end_date < nextStartDate) {
        nextState.end_date = "";
      }
      return nextState;
    });
    setIsStartCalendarOpen(false);
  };

  const setEndDate = (date?: Date) => {
    if (!date) return;
    setFormData((prev) => ({ ...prev, end_date: toDateInputValue(date) }));
    setIsEndCalendarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.start_date) {
      toast.error("Please select a start date");
      setIsLoading(false);
      return;
    }

    if (!formData.end_date) {
      toast.error("Please select an end date");
      setIsLoading(false);
      return;
    }

    if (formData.start_date < today) {
      toast.error("Start date cannot be in the past");
      setIsLoading(false);
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast.error("End date cannot be before start date");
      setIsLoading(false);
      return;
    }

    try {
      await onSubmitAction({ ...formData, staff_id: staffId });
      setFormData({
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1 pb-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 focus-within:text-blue-600">
          <Label htmlFor="start_date" className="font-medium">Start Date <span className="text-red-500">*</span></Label>
          <input type="hidden" id="start_date" name="start_date" value={formData.start_date} required />
          <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between border-gray-200 bg-gray-50 hover:bg-white rounded-xl min-h-[50px] px-3 text-left font-normal ${selectedStartDate ? "text-gray-800" : "text-gray-500"}`}
              >
                {selectedStartDate ? format(selectedStartDate, "PPP") : "Select start date"}
                <CalendarIcon className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedStartDate}
                onSelect={setStartDate}
                disabled={(date) => date < todayDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5 focus-within:text-blue-600">
          <Label htmlFor="end_date" className="font-medium">End Date <span className="text-red-500">*</span></Label>
          <input type="hidden" id="end_date" name="end_date" value={formData.end_date} required />
          <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-between border-gray-200 bg-gray-50 hover:bg-white rounded-xl min-h-[50px] px-3 text-left font-normal ${selectedEndDate ? "text-gray-800" : "text-gray-500"}`}
              >
                {selectedEndDate ? format(selectedEndDate, "PPP") : "Select end date"}
                <CalendarIcon className="h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedEndDate}
                onSelect={setEndDate}
                disabled={(date) => date < (selectedStartDate || todayDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="space-y-1.5 focus-within:text-blue-600 mt-2">
        <Label htmlFor="reason" className="font-medium">Reason for Leave/Absence <span className="text-red-500">*</span></Label>
        <textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          rows={4}
          className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all p-4 text-gray-800 outline-none resize-none"
          placeholder="Please describe the reason for your leave request..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full px-6 text-gray-600">
            Cancel
          </Button>
        )}
        <LoadingButton type="submit" isLoading={isLoading} className="rounded-full px-6">
          Submit Request
        </LoadingButton>
      </div>
    </form>
  );
}
