"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";

interface OpenAcademicSessionCardProps {
  canManage: boolean;
}

type SessionPayload = {
  label: string;
  feeAmount: number;
  source: string;
  suggestedNextLabel?: string;
  openedAt?: string | null;
};

export function OpenAcademicSessionCard({
  canManage,
}: OpenAcademicSessionCardProps) {
  const [current, setCurrent] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sessionLabel, setSessionLabel] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [confirmLabel, setConfirmLabel] = useState("");
  const [resetOccupancy, setResetOccupancy] = useState(true);
  const [seedResumption, setSeedResumption] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/sessions");
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Failed to load");
      const data = result.data as SessionPayload;
      setCurrent(data);
      setSessionLabel(data.suggestedNextLabel || data.label);
      setFeeAmount(String(data.feeAmount));
    } catch (error: any) {
      toast.error(error.message || "Failed to load active session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const feePreview = useMemo(() => {
    const n = Number(feeAmount);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n.toLocaleString();
  }, [feeAmount]);

  const handleOpen = async () => {
    if (!canManage) return;

    if (resetOccupancy) {
      const ok = window.confirm(
        `Open session ${sessionLabel} and CLEAR all room assignments?\n\nBeds will be freed. Returning students must pay for ${sessionLabel} and pick a room again. Old payments are kept with their session labels.`
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(
        `Activate session ${sessionLabel} without clearing rooms?\n\nStudents who already have beds will remain placed. Only use this to update the fee/label mid-cycle.`
      );
      if (!ok) return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionLabel: sessionLabel.trim(),
          confirmLabel: confirmLabel.trim(),
          feeAmount: Number(feeAmount),
          resetOccupancy,
          seedResumption,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to open session");
      }

      toast.success(result.data.message);
      setConfirmLabel("");
      setIsLoading(true);
      await load();
    } catch (error: any) {
      toast.error(error.message || "Failed to open session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CardContainer title="Academic Session">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-gray-600">Active:</span>
          <span className="font-medium text-gray-900">
            {isLoading
              ? "Loading…"
              : current
                ? `${current.label} · ₦${current.feeAmount.toLocaleString()}`
                : "Unavailable"}
          </span>
          {current?.source && (
            <span className="text-xs text-gray-500">
              ({current.source === "settings" ? "admin-set" : "calendar default"})
            </span>
          )}
        </div>

        {canManage && !isLoading && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600">
              Open a new session so payments, dashboard stats, and resumption
              check-in use the new label and fee. Enable occupancy reset so
              everything starts fresh for that year.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-gray-700">Session label</span>
                <input
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={sessionLabel}
                  onChange={(e) => setSessionLabel(e.target.value)}
                  placeholder="2027/2028"
                  disabled={isSubmitting}
                />
              </label>
              <label className="block text-sm">
                <span className="text-gray-700">Fee (₦)</span>
                <input
                  type="number"
                  min={1000}
                  step={100}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(e.target.value)}
                  disabled={isSubmitting}
                />
                {feePreview && (
                  <span className="mt-1 block text-xs text-gray-500">
                    Preview: ₦{feePreview}
                  </span>
                )}
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-gray-700">
                Type the session label to confirm
              </span>
              <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={confirmLabel}
                onChange={(e) => setConfirmLabel(e.target.value)}
                placeholder={sessionLabel || "2027/2028"}
                disabled={isSubmitting}
              />
            </label>

            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={resetOccupancy}
                onChange={(e) => setResetOccupancy(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>
                Reset occupancy — clear all room assignments, free every bed,
                and require returning students to pay + pick a room again for
                this session.
              </span>
            </label>

            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={seedResumption}
                onChange={(e) => setSeedResumption(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>
                Seed resumption checklists for all active students under this
                session (pending gate verification).
              </span>
            </label>

            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={
                  isSubmitting ||
                  !sessionLabel.trim() ||
                  confirmLabel.trim() !== sessionLabel.trim()
                }
                onClick={handleOpen}
              >
                {isSubmitting ? "Opening…" : "Open academic session"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </CardContainer>
  );
}
