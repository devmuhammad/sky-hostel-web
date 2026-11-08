"use client";

import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { Label } from "@/shared/components/ui/label";

interface RefundReasonModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function RefundReasonModal({
  isOpen,
  title = "Refund payment",
  description = "This stops the student at whatever stage they are. If they already have a room, that bed becomes available again. Return collected money in Paycashless if needed.",
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  isSubmitting,
}: RefundReasonModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      hideDefaultFooter
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="refund-reason">Reason *</Label>
          <textarea
            id="refund-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            placeholder="Why is this payment being refunded?"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            onClick={onClose}
            className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <LoadingButton
            isLoading={isSubmitting}
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Confirm refund
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
}
