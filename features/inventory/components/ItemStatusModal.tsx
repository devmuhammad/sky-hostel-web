"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { Button } from "@/shared/components/ui/button";

const STATUS_OPTIONS = [
  { value: "good", label: "Good" },
  { value: "damaged", label: "Damaged" },
  { value: "missing", label: "Missing" },
  { value: "under_maintenance", label: "Under Maintenance" },
];

interface InventoryItemLike {
  id: string;
  name: string;
  item_status?: string | null;
  status_before_checkin?: string | null;
  status_during_occupancy?: string | null;
  status_after_exit?: string | null;
  stage_notes?: string | null;
}

interface ItemStatusModalProps {
  item: InventoryItemLike | null;
  onClose: () => void;
  onSaved: () => void;
}

function StatusSelect({
  id,
  label,
  value,
  allowUnset,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  allowUnset?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors py-2.5 px-3 outline-none"
      >
        {allowUnset && <option value="">Not Inspected</option>}
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ItemStatusModal({ item, onClose, onSaved }: ItemStatusModalProps) {
  const [form, setForm] = useState({
    item_status: item?.item_status || "good",
    status_before_checkin: item?.status_before_checkin || "",
    status_during_occupancy: item?.status_during_occupancy || "",
    status_after_exit: item?.status_after_exit || "",
    stage_notes: item?.stage_notes || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/inventory/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, ...form }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Item status updated");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update item status");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!item} onClose={onClose} title={item ? `Status — ${item.name}` : "Item Status"} hideDefaultFooter>
      {item && (
        <div className="space-y-5">
          <StatusSelect
            id="item_status"
            label="Current Item Status"
            value={form.item_status}
            onChange={(value) => setForm((prev) => ({ ...prev, item_status: value }))}
          />

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-900">Occupancy Stage Inspection</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Capture the item&apos;s condition at each stage of the occupancy cycle.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatusSelect
                id="status_before_checkin"
                label="1. Before Check-in"
                value={form.status_before_checkin}
                allowUnset
                onChange={(value) => setForm((prev) => ({ ...prev, status_before_checkin: value }))}
              />
              <StatusSelect
                id="status_during_occupancy"
                label="2. During Occupancy"
                value={form.status_during_occupancy}
                allowUnset
                onChange={(value) => setForm((prev) => ({ ...prev, status_during_occupancy: value }))}
              />
              <StatusSelect
                id="status_after_exit"
                label="3. After Exit"
                value={form.status_after_exit}
                allowUnset
                onChange={(value) => setForm((prev) => ({ ...prev, status_after_exit: value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage_notes">Inspection Notes (Optional)</Label>
            <textarea
              id="stage_notes"
              value={form.stage_notes}
              onChange={(event) => setForm((prev) => ({ ...prev, stage_notes: event.target.value }))}
              rows={3}
              placeholder="Notes about the item across stages..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-6 text-gray-600">
              Cancel
            </Button>
            <LoadingButton onClick={handleSave} isLoading={isSaving} loadingText="Saving..." className="rounded-full px-6">
              Save Status
            </LoadingButton>
          </div>
        </div>
      )}
    </Modal>
  );
}
