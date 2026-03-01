import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";

interface DailyLogFormProps {
  onSubmitAction: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function DailyLogForm({ onSubmitAction, onCancel }: DailyLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    shift: "day",
    duty_type: "",
    activities: "",
    issues_observed: "",
    materials_used: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmitAction(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-2" aria-label="Daily Log Form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="shift">Shift</Label>
          <select
            id="shift"
            name="shift"
            value={formData.shift}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors py-2.5 px-3 outline-none"
          >
            <option value="day">Day</option>
            <option value="night">Night</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duty_type">Primary Duty <span className="text-red-500">*</span></Label>
          <Input 
            id="duty_type" 
            name="duty_type" 
            value={formData.duty_type} 
            onChange={handleChange} 
            required
            className="border-gray-200 bg-gray-50 focus:bg-white"
            placeholder="e.g. Toilet Cleaning, Reception" 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="activities">Activities Completed <span className="text-red-500">*</span></Label>
        <textarea
          id="activities"
          name="activities"
          value={formData.activities}
          onChange={handleChange as any}
          required
          rows={3}
          className="w-full border-gray-200 bg-gray-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors p-3 outline-none resize-none"
          placeholder="List the key tasks you completed..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="issues_observed">Issues or Incidents Observed (Optional)</Label>
        <textarea
          id="issues_observed"
          name="issues_observed"
          value={formData.issues_observed}
          onChange={handleChange as any}
          rows={2}
          className="w-full border-gray-200 bg-gray-50 focus:bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors p-3 outline-none resize-none"
          placeholder="Any damages, missing items, or notable events..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="materials_used">Materials Used (Optional)</Label>
        <Input 
          id="materials_used" 
          name="materials_used" 
          value={formData.materials_used} 
          onChange={handleChange} 
          className="border-gray-200 bg-gray-50 focus:bg-white"
          placeholder="e.g. 2 bottles of bleach, 1 mop head" 
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-full px-6 border-gray-200 text-gray-600">
            Cancel
          </Button>
        )}
        <LoadingButton type="submit" isLoading={isLoading} data-testid="submit-log-btn" className="rounded-full px-6">
          Submit Log
        </LoadingButton>
      </div>
    </form>
  );
}
