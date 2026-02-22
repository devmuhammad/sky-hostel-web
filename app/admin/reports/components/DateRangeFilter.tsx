"use client";

import { CardContainer } from "@/shared/components/ui/card-container";

interface DateRangeFilterProps {
  dateRange: { from: string; to: string };
  onDateRangeChange: (dateRange: { from: string; to: string }) => void;
  onPresetRangeChange: (preset: "last_30_days" | "last_12_months" | "all_time") => void;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  onPresetRangeChange,
}: DateRangeFilterProps) {
  return (
    <CardContainer className="border-gray-200 bg-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
            From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, from: e.target.value })
              }
              className="mt-1 block h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
            To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, to: e.target.value })
              }
              className="mt-1 block h-11 w-full rounded-xl border border-gray-200 px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPresetRangeChange("last_30_days")}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => onPresetRangeChange("last_12_months")}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Last 12 Months
          </button>
          <button
            type="button"
            onClick={() => onPresetRangeChange("all_time")}
            className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            All Time
          </button>
        </div>
      </div>
    </CardContainer>
  );
}
