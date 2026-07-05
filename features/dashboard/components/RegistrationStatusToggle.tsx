"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { CardContainer } from "@/shared/components/ui/card-container";

interface RegistrationStatusToggleProps {
  canToggle: boolean;
}

export function RegistrationStatusToggle({
  canToggle,
}: RegistrationStatusToggleProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const res = await fetch("/api/settings/registration");
        const result = await res.json();
        if (!cancelled && result.success) {
          setIsOpen(result.data.isOpen);
        }
      } catch {
        // Leave as null; card will just show a neutral state
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (nextIsOpen: boolean) => {
    try {
      setIsUpdating(true);
      const res = await fetch("/api/admin/settings/registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: nextIsOpen }),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update registration status");
      }

      setIsOpen(result.data.isOpen);
      toast.success(
        result.data.isOpen
          ? "Registration is now open to applicants"
          : "Registration is now closed — visitors will be sent to the sold-out page"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update registration status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <CardContainer title="Registration Status">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              isLoading
                ? "bg-gray-300"
                : isOpen
                  ? "bg-emerald-500"
                  : "bg-rose-500"
            }`}
          />
          <span className="text-sm font-medium text-gray-900">
            {isLoading
              ? "Checking status..."
              : isOpen
                ? "Open — applicants can register"
                : "Closed — visitors are redirected to the sold-out page"}
          </span>
        </div>

        {canToggle && !isLoading && (
          <Button
            variant={isOpen ? "outline" : "default"}
            size="sm"
            disabled={isUpdating}
            onClick={() => handleToggle(!isOpen)}
          >
            {isUpdating
              ? "Updating..."
              : isOpen
                ? "Close Registration"
                : "Reopen Registration"}
          </Button>
        )}
      </div>
    </CardContainer>
  );
}
