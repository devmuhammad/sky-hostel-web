import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { useToast } from "@/shared/hooks/useToast";

export function usePaymentManagement() {
  const { payments, setPayments, setLoading } = useAppStore();
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWebhookUpdateRef = useRef<number>(0);
  const toast = useToast();

  // Track last webhook update time
  useEffect(() => {
    const lastUpdate = payments.reduce((latest, payment) => {
      if (payment.last_webhook_update) {
        const updateTime = new Date(payment.last_webhook_update).getTime();
        return Math.max(latest, updateTime);
      }
      return latest;
    }, 0);

    lastWebhookUpdateRef.current = lastUpdate;
  }, [payments]);

  // Smart refetching system
  useEffect(() => {
    let isActive = true;

    const startRefetching = () => {
      if (intervalRef.current) return;

      intervalRef.current = setInterval(async () => {
        // Only refetch if admin is active and no recent webhook updates
        if (!isActive) return;

        const timeSinceLastWebhook = Date.now() - lastWebhookUpdateRef.current;
        const timeSinceLastFetch =
          Date.now() - (useAppStore.getState().lastDataFetch || 0);

        // Skip refetch if:
        // 1. Recent webhook update (< 10 seconds)
        // 2. Recent manual fetch (< 30 seconds)
        if (timeSinceLastWebhook < 10000 || timeSinceLastFetch < 30000) {
          return;
        }

        try {
          setIsRefetching(true);
          const response = await fetch("/api/payments", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok && isActive) {
            const data = await response.json();
            if (data.success && data.payments) {
              setPayments(data.payments);
              useAppStore.getState().setLastDataFetch(Date.now());
            }
          }
        } catch (error) {
          // Silent fail for background refetch
        } finally {
          if (isActive) {
            setIsRefetching(false);
          }
        }
      }, 30000); // 30 seconds
    };

    const stopRefetching = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Start refetching when component mounts
    startRefetching();

    // Handle visibility change (tab hidden/shown)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRefetching();
      } else {
        startRefetching();
      }
    };

    // Handle page focus/blur
    const handleFocus = () => startRefetching();
    const handleBlur = () => stopRefetching();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      isActive = false;
      stopRefetching();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setPayments]);

  const syncAllPayments = useCallback(async () => {
    setIsSyncingAll(true);
    try {
      const response = await fetch("/api/payments/sync-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: "admin123" }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success("All payments synced successfully");
          // Refresh payments data
          const refreshResponse = await fetch("/api/payments", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            if (data.success && data.payments) {
              setPayments(data.payments);
              useAppStore.getState().setLastDataFetch(Date.now());
            }
          }
        } else {
          toast.error(result.message || "Failed to sync payments");
        }
      } else {
        toast.error("Failed to sync payments");
      }
    } catch (error) {
      toast.error("Error syncing payments");
    } finally {
      setIsSyncingAll(false);
    }
  }, [setPayments, toast]);

  return {
    syncAllPayments,
    isSyncingAll,
    isRefetching,
  };
}
