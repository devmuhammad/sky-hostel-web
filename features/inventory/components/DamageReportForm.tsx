import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { FileUpload } from "@/shared/components/ui/file-upload";

interface DamageReportFormProps {
  itemId: string;
  itemName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  onSubmitAction?: (data: any) => Promise<void>; 
}

export function DamageReportForm({ itemId, itemName, onSuccess, onCancel, onSubmitAction }: DamageReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    cost_estimate: "",
    responsible_student_id: "",
    status: "unresolved",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.description) {
        throw new Error("Description is required");
      }

      if (onSubmitAction) {
        await onSubmitAction({ ...formData, file, itemId });
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Damage Report Form">
      <div>
        <h3 className="text-lg font-medium">Report Damage for: {itemName}</h3>
      </div>

      <div>
        <Label htmlFor="description">Description of Damage *</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange as any}
          required
          rows={4}
          className="w-full mt-1 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what is damaged..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cost_estimate">Cost Estimate (₦) Optional</Label>
          <Input 
            id="cost_estimate" 
            name="cost_estimate" 
            type="number"
            min="0"
            step="0.01"
            value={formData.cost_estimate} 
            onChange={handleChange} 
            placeholder="e.g. 5000" 
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full mt-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
          >
            <option value="unresolved">Unresolved</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="responsible_student_id">Responsible Student ID (Optional)</Label>
        <Input 
          id="responsible_student_id" 
          name="responsible_student_id" 
          value={formData.responsible_student_id} 
          onChange={handleChange} 
          placeholder="Enter Student UUID if known" 
        />
      </div>

      <div>
        <Label>Photo Evidence (Optional)</Label>
        <div className="mt-1">
          <FileUpload
            onFileSelect={setFile}
            accept="image/*"
            maxSize={5} 
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <LoadingButton type="submit" isLoading={isLoading} data-testid="submit-btn">
          Submit Report
        </LoadingButton>
      </div>
    </form>
  );
}
