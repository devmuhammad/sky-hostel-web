import { ReactNode, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface Filter {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filters?: Filter[];
  onRowAction?: (item: T) => void;
  actionLabel?: string;
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description: string;
  };
  title?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search...",
  searchFields = [],
  filters = [],
  onRowAction,
  actionLabel = "View Details",
  emptyState,
  title,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search and filters
  const filteredData = data.filter((item) => {
    // Search filter
    const matchesSearch =
      searchFields.length === 0 ||
      searchFields.some((field) => {
        const value = item[field];
        return (
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

    // Custom filters
    const matchesFilters = filters.every((filter) => {
      return !filter.value || item[filter.key] === filter.value;
    });

    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return <DataTableSkeleton />;
  }

  return (
    <div className="space-y-4 lg:space-y-6 w-full">
      {/* Search and Filters */}
      {(searchFields.length > 0 || filters.length > 0) && (
        <Card>
          <CardContent className="pt-4 lg:pt-6">
            <div className="grid gap-3 lg:gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {searchFields.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    Search
                  </label>
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 lg:mb-2">
                    {filter.label}
                  </label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card className="w-full">
        {title && (
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">
              {title} ({filteredData.length})
            </CardTitle>
          </CardHeader>
        )}

        <CardContent className={title ? "p-0" : "pt-4 lg:pt-6"}>
          <div className="w-full overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={`${column.className || ""} text-xs sm:text-sm lg:text-base`}
                        >
                          {column.header}
                        </TableHead>
                      ))}
                      {onRowAction && (
                        <TableHead className="text-right text-xs sm:text-sm lg:text-base">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={item.id || index}>
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={`${column.className || ""} text-xs sm:text-sm lg:text-base p-2 lg:p-3`}
                          >
                            {column.render(item)}
                          </TableCell>
                        ))}
                        {onRowAction && (
                          <TableCell className="text-right p-2 lg:p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRowAction(item)}
                              className="text-xs sm:text-sm"
                            >
                              {actionLabel}
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {filteredData.length === 0 && emptyState && (
            <div className="text-center py-8 lg:py-12">
              {emptyState.icon || (
                <svg
                  className="mx-auto h-8 w-8 lg:h-12 lg:w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
              )}
              <h3 className="mt-2 text-sm lg:text-base font-medium text-gray-900">
                {emptyState.title}
              </h3>
              <p className="mt-1 text-xs lg:text-sm text-gray-500">
                {emptyState.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DataTableSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Search skeleton */}
      <Card>
        <CardContent className="pt-4 lg:pt-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
