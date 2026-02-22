"use client";

import { CardContainer } from "@/shared/components/ui/card-container";
import { EmptyState } from "@/shared/components/ui/empty-state";

interface AnalyticsChartsProps {
  studentsByFaculty: Record<string, number>;
  studentsByLevel: Record<string, number>;
  registrationTrend: Array<{ date: string; count: number }>;
}

export function AnalyticsCharts({
  studentsByFaculty,
  studentsByLevel,
  registrationTrend,
}: AnalyticsChartsProps) {
  const facultyEntries = Object.entries(studentsByFaculty).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  );
  const levelEntries = Object.entries(studentsByLevel).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  );
  const maxRegistrationCount = Math.max(
    ...registrationTrend.map((day) => day.count),
    0
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CardContainer title="Students by Faculty" className="border-gray-200 overflow-hidden">
          {facultyEntries.length ? (
            <div className="max-h-[420px] overflow-y-auto overflow-x-hidden space-y-3 pr-1">
              {facultyEntries.map(([faculty, count]) => (
                <div key={faculty} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-700">{faculty}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Faculty Data"
              description="No student registrations found for this date range."
            />
          )}
        </CardContainer>

        <CardContainer title="Students by Level" className="border-gray-200 overflow-hidden">
          {levelEntries.length ? (
            <div className="max-h-[420px] overflow-y-auto overflow-x-hidden space-y-3 pr-1">
              {levelEntries.map(([level, count]) => (
                <div key={level} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-sm text-gray-700">{level}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Level Data"
              description="No student levels found for this date range."
            />
          )}
        </CardContainer>
      </div>

      <CardContainer title="Registration Trend (Last 30 Days)" className="border-gray-200 overflow-hidden">
        {maxRegistrationCount > 0 ? (
          <>
            <div className="h-64 flex items-end gap-1">
              {registrationTrend.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                  style={{
                    height: `${Math.max((day.count / maxRegistrationCount) * 220, 6)}px`,
                  }}
                  title={`${day.date}: ${day.count} registrations`}
                />
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500 text-center">
              Daily student registrations
            </div>
          </>
        ) : (
          <EmptyState
            title="No Registration Trend"
            description="No new registrations were recorded in the selected period."
          />
        )}
      </CardContainer>
    </>
  );
}
