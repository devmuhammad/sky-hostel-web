"use client";

import React from "react";
import { useAppStore } from "@/shared/store/appStore";
import { PageLoadingSkeleton } from "./loading-skeleton";

interface DashboardLoadingProps {
  children: React.ReactNode;
  page?: string;
}

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  children,
  page = "dashboard",
}) => {
  const { loading } = useAppStore();
  const isLoading = loading[page as keyof typeof loading] || false;

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  return <>{children}</>;
};

export const DashboardLoadingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { loading } = useAppStore();
  const isDashboardLoading = loading.dashboard || false;

  return (
    <div className="relative">
      {isDashboardLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}; 