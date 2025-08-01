import React from "react";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = "",
  count = 1,
  height = "h-4",
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${height} ${className}`}
        />
      ))}
    </>
  );
};

export const TableLoadingSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-gray-200 rounded animate-pulse flex-1"
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-gray-200 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardLoadingSkeleton: React.FC<{ cards?: number }> = ({
  cards = 4,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const PageLoadingSkeleton: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
      
      {/* Content */}
      <div className="space-y-6">
        <CardLoadingSkeleton cards={4} />
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
            <TableLoadingSkeleton rows={8} columns={5} />
          </div>
        </div>
      </div>
    </div>
  );
};
