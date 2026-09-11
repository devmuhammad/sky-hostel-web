"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [isOpen, setIsOpen] = useState(false);

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

  const summary = isLoading
    ? "Loading…"
    : current
      ? `${current.label} · ₦${current.feeAmount.toLocaleString()}`
      : "Unavailable";

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
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to open session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <p className="text-base font-semibold leading-none tracking-tight text-gray-900">
            Academic Session
          </p>
          <p className="mt-2 truncate text-sm text-gray-600">
            Active:{" "}
            <span className="font-medium text-gray-900">{summary}</span>
            {current?.source && !isLoading && (
              <span className="ml-1 text-xs text-gray-500">
                ({current.source === "settings" ? "admin-set" : "calendar default"})
              </span>
            )}
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <CardContent className="border-t border-gray-100 pt-4">
          {!canManage || isLoading ? (
            <p className="text-sm text-gray-600">
              {canManage
                ? "Loading session controls…"
                : "Only super admins can open a new academic session."}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Open a new session so payments, dashboard stats, and resumption
                check-in use the new label and fee. Enable occupancy reset so
                everything starts fresh for that year.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </CardContent>
      )}
    </Card>
  );
}
