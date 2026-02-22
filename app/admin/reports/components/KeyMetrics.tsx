"use client";

import { CardContainer } from "@/shared/components/ui/card-container";

interface KeyMetricsProps {
  totalStudents: number;
  totalRevenue: number;
  occupancyRate: number;
  completedPayments: number;
}

export function KeyMetrics({
  totalStudents,
  totalRevenue,
  occupancyRate,
  completedPayments,
}: KeyMetricsProps) {
  const metrics = [
    {
      title: "Total Students",
      value: totalStudents.toLocaleString(),
      accent: "bg-blue-100 text-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
    },
    {
      title: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString()}`,
      accent: "bg-green-100 text-green-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate}%`,
      accent: "bg-amber-100 text-amber-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: "Completed Payments",
      value: completedPayments.toLocaleString(),
      accent: "bg-indigo-100 text-indigo-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
      {metrics.map((metric) => (
        <CardContainer key={metric.title} className="border-gray-200">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${metric.accent}`}>
              {metric.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.title}</p>
              <p className="text-4xl md:text-3xl font-semibold tracking-tight text-gray-900 mt-1">
                {metric.value}
              </p>
            </div>
          </div>
        </CardContainer>
      ))}
    </div>
  );
}
