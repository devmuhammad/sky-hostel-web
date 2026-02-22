import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { toast } from "sonner";
import { FileUpload } from "@/shared/components/ui/file-upload";
import { createClientSupabaseClient } from "@/shared/config/auth";

interface ReportFormProps {
  studentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReportForm({ studentId, onSuccess, onCancel }: ReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "warning",
    severity: "low",
    status: "unresolved",
    comments: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadEvidence = async (file: File) => {
    const supabase = createClientSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}-${Date.now()}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('student-documents') // Reuse existing bucket or create a new one, assuming this exists
      .upload(filePath, file);

    if (uploadError) {
      throw new Error("Failed to upload file");
    }

    const { data: publicData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath);

    return publicData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let evidence_url = null;
      if (file) {
        evidence_url = await uploadEvidence(file);
      }

      const response = await fetch(`/api/admin/students/${studentId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, evidence_url }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit report");
      }

      toast.success("Report submitted successfully");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-h-[68vh] space-y-5 overflow-y-auto px-1 pb-1">
      <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/60 p-4 sm:p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-semibold text-gray-800">Title *</Label>
        <Input 
          id="title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          placeholder="Brief description of the incident" 
          className="h-12 rounded-xl border-gray-200 bg-white px-4 text-[15px] shadow-sm focus:border-gray-400 focus:ring-gray-200"
        />
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-semibold text-gray-800">Category *</Label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="warning">Warning</option>
              <option value="misconduct">Misconduct</option>
              <option value="damage">Damage</option>
              <option value="late_payment">Late Payment</option>
              <option value="disturbance">Disturbance</option>
              <option value="commendation">Commendation</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="severity" className="text-sm font-semibold text-gray-800">Severity *</Label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-sm font-semibold text-gray-800">Initial Status</Label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            <option value="unresolved">Unresolved</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="comments" className="text-sm font-semibold text-gray-800">Details / Comments</Label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange as any}
            rows={5}
            className="w-full rounded-xl border border-gray-200 bg-white p-4 text-[15px] shadow-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Provide detailed information about the incident..."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
        <Label className="text-sm font-semibold text-gray-800">Evidence (Optional)</Label>
        <p className="mt-1 text-xs text-gray-500">Attach image proof of the report (max 5MB).</p>
        <div className="mt-3">
          <FileUpload
            onFileSelect={setFile}
            accept="image/*,application/pdf"
            maxSize={5}
            className="[&>div]:rounded-xl [&>div]:border-gray-200 [&>div]:bg-gray-50/70 [&>div]:p-7"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 bg-white/95 pt-4 pb-1">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl px-6">
          Cancel
        </Button>
        <LoadingButton type="submit" isLoading={isLoading} className="rounded-xl px-6">
          Submit Report
        </LoadingButton>
      </div>
    </form>
  );
}
