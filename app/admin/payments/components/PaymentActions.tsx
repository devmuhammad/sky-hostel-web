"use client";

import { Button } from "@/shared/components/ui/button";
import { LoadingButton } from "@/shared/components/ui/loading-button";

interface PaymentActionsProps {
  sessionLabel: string;
  onSessionChange: (session: string) => void;
  sessionOptions: string[];
  onSyncAll: () => void;
  isSyncingAll: boolean;
  isRefetching?: boolean;
  showReconcile?: boolean;
  onReconcile?: () => void;
  isReconciling?: boolean;
}

export function PaymentActions({
  sessionLabel,
  onSessionChange,
  sessionOptions,
  onSyncAll,
  isSyncingAll,
  isRefetching,
  showReconcile,
  onReconcile,
  isReconciling,
}: PaymentActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Payments</h2>
        <select
          value={sessionLabel}
          onChange={(e) => onSessionChange(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          {sessionOptions.map((session) => (
            <option key={session} value={session}>
              Session {session}
            </option>
          ))}
          <option value="all">All sessions</option>
        </select>
        {isRefetching && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Auto-refreshing...</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {showReconcile && onReconcile && (
          <LoadingButton
            isLoading={!!isReconciling}
            onClick={onReconcile}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Re-date from invoices
          </LoadingButton>
        )}
        <Button
          onClick={onSyncAll}
          disabled={isSyncingAll}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSyncingAll ? "Syncing..." : "Sync All (update only)"}
        </Button>
      </div>
    </div>
  );
}
