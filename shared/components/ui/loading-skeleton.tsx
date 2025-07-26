import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return <Skeleton className={className} />;
}

interface StatsLoadingSkeletonProps {
  count?: number;
  columns?: number;
}

export function StatsLoadingSkeleton({
  count = 4,
  columns = 4,
}: StatsLoadingSkeletonProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`grid ${gridCols[columns as keyof typeof gridCols] || gridCols[4]} gap-6`}
    >
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface TableLoadingSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export function TableLoadingSkeleton({
  rows = 5,
  showHeader = true,
}: TableLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Search/Filter skeleton */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
        )}
        <CardContent className={showHeader ? "" : "pt-6"}>
          <div className="space-y-3">
            {[...Array(rows)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ChartLoadingSkeletonProps {
  count?: number;
  columns?: number;
}

export function ChartLoadingSkeleton({
  count = 4,
  columns = 2,
}: ChartLoadingSkeletonProps) {
  const gridCols = columns === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2";

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-2 w-16 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
