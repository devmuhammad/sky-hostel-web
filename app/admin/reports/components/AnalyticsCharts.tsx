"use client";

import { CardContainer } from "@/shared/components/ui/card-container";

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
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CardContainer title="Students by Faculty">
          <div className="space-y-3">
            {Object.entries(studentsByFaculty)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([faculty, count]) => (
                <div
                  key={faculty}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{faculty}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </CardContainer>

        <CardContainer title="Students by Level">
          <div className="space-y-3">
            {Object.entries(studentsByLevel)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{level}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {count as number}
                  </span>
                </div>
              ))}
          </div>
        </CardContainer>
      </div>

      <CardContainer title="Registration Trend (Last 30 Days)">
        <div className="h-64 flex items-end space-x-1">
          {registrationTrend.map((day, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t"
              style={{
                height: `${Math.max((day.count / Math.max(...registrationTrend.map((d) => d.count))) * 200, 4)}px`,
              }}
              title={`${day.date}: ${day.count} registrations`}
            ></div>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Daily student registrations
        </div>
      </CardContainer>
    </>
  );
}
