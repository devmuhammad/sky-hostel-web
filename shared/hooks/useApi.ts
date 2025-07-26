import { useState, useEffect } from "react";
import { ActionResponse } from "@/shared/types/global";

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(
  url: string,
  options: RequestInit = {},
  { immediate = false }: UseApiOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (overrideOptions?: RequestInit) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, { ...options, ...overrideOptions });
      const result: ActionResponse<T> = await response.json();

      if (result.success) {
        setData(result.data || null);
        return { success: true, data: result.data };
      } else {
        setError(result.error?.message || "An error occurred");
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      return { success: false, error: { message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [url, immediate]);

  return {
    data,
    isLoading,
    error,
    execute,
    refetch: () => execute(),
  };
}

// Specialized hooks for our entities
export function useRooms(block?: string) {
  const url = block
    ? `/api/rooms?block=${encodeURIComponent(block)}`
    : "/api/rooms";
  return useApi(url, {}, { immediate: true });
}

export function useBlocks() {
  return useApi("/api/rooms", { method: "POST" }, { immediate: true });
}

export function usePaymentVerification() {
  return useApi("/api/payments/verify", { method: "POST" });
}
