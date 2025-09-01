import { useState } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { useAppData } from "@/shared/hooks/useAppData";
import { Payment } from "@/shared/store/appStore";
import { useAppStore } from "@/shared/store/appStore";

interface PaycashlessPaymentInfo {
  invoiceId: string;
  totalPaid: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  hasPartialPayment: boolean;
  status: string;
}

interface ManualCheckResult {
  email: string;
  paycashlessData: PaycashlessPaymentInfo | null;
  localPayments: Payment[];
  needsUpdate: boolean;
  updateMessage: string;
  cleanupAction: string;
  hasPaycashlessOnly?: boolean;
}

export function useManualPaymentCheck() {
  const [manualEmail, setManualEmail] = useState("");
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [manualCheckResult, setManualCheckResult] =
    useState<ManualCheckResult | null>(null);
  const [showManualCheckModal, setShowManualCheckModal] = useState(false);

  const toast = useToast();
  const { refetch } = useAppData();
  const { payments } = useAppStore();

  const handleManualPaymentCheck = async () => {
    if (!manualEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsManualChecking(true);
    try {
      const paycashlessResponse = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: manualEmail }),
      });

      const paycashlessResult = await paycashlessResponse.json();

      const paycashlessData =
        paycashlessResult.success && paycashlessResult.paycashless
          ? {
              invoiceId: paycashlessResult.paycashless.payment_id || "Unknown",
              totalPaid: paycashlessResult.paycashless.totalPaid || 0,
              remainingAmount:
                paycashlessResult.paycashless.remainingAmount || 0,
              isFullyPaid: paycashlessResult.paycashless.isFullyPaid || false,
              hasPartialPayment:
                (paycashlessResult.paycashless.totalPaid || 0) > 0 &&
                !paycashlessResult.paycashless.isFullyPaid,
              status: paycashlessResult.paycashless.isFullyPaid
                ? "Fully Paid"
                : paycashlessResult.paycashless.totalPaid > 0
                  ? "Partially Paid"
                  : "No Payments",
            }
          : null;

      const hasPaycashlessOnly = paycashlessResult.hasPaycashlessOnly || false;

      const localPayments = payments.filter((p) => p.email === manualEmail);

      const hasLocalPartialPayment = localPayments.some(
        (p) => p.status === "partially_paid"
      );
      const hasLocalCompletedPayment = localPayments.some(
        (p) => p.status === "completed"
      );
      const hasLocalPendingPayment = localPayments.some(
        (p) => p.status === "pending"
      );

      let needsUpdate = false;
      let updateMessage = "";
      let cleanupAction = "";

      if (hasPaycashlessOnly) {
        needsUpdate = true;
        updateMessage = `Payment found on Paycashless but not in local database. Total paid: ₦${paycashlessData?.totalPaid.toLocaleString() || "0"}`;
        cleanupAction = "Create local payment record from Paycashless data";
        // Update needed: PayCashless only
      } else if (paycashlessData) {
        if (paycashlessData.isFullyPaid) {
          needsUpdate = true;
          updateMessage = `Paycashless shows fully paid (₦${paycashlessData.totalPaid.toLocaleString()})`;
          cleanupAction =
            "Keep one invoice, mark as completed, delete duplicates";
        } else if (paycashlessData.hasPartialPayment) {
          needsUpdate = true;
          updateMessage = `Paycashless shows partial payment (₦${paycashlessData.totalPaid.toLocaleString()}) from INVOICE_PAYMENT_SUCCEEDED event`;
          cleanupAction =
            "Keep one invoice, mark as partially_paid, delete duplicates";
          // Update needed: Partial payment on PayCashless
        } else {
          updateMessage = "No payments found on Paycashless";
          cleanupAction = "Keep most recent invoice, delete others";
        }
      } else {
        updateMessage = "No payment data found on Paycashless";
        cleanupAction = "Keep most recent invoice, delete others";
      }

      if (hasLocalPartialPayment) {
        updateMessage += " | Local: Has partially_paid status";
      }
      if (hasLocalCompletedPayment) {
        updateMessage += " | Local: Has completed payment";
      }
      if (hasLocalPendingPayment) {
        updateMessage += " | Local: Has pending payments";
      }

      const result = {
        email: manualEmail,
        paycashlessData,
        localPayments,
        needsUpdate,
        updateMessage,
        cleanupAction,
        hasPaycashlessOnly,
      };

      setManualCheckResult(result);
      setShowManualCheckModal(true);
    } catch (error) {
      toast.error("Error checking payment status");
    } finally {
      setIsManualChecking(false);
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!manualCheckResult?.needsUpdate) return;

    setIsManualChecking(true);
    try {
      let invoiceToKeep: Payment | null = null;
      let newStatus = "pending";
      let newAmountPaid = 0;

      if (manualCheckResult.paycashlessData) {
        if (manualCheckResult.paycashlessData.isFullyPaid) {
          newStatus = "completed";
          newAmountPaid = manualCheckResult.paycashlessData.totalPaid;
        } else if (manualCheckResult.paycashlessData.hasPartialPayment) {
          newStatus = "partially_paid";
          newAmountPaid = manualCheckResult.paycashlessData.totalPaid;
        }
      }

      invoiceToKeep = manualCheckResult.localPayments.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      const invoicesToDelete = manualCheckResult.localPayments
        .filter((p) => p.id !== invoiceToKeep?.id)
        .map((p) => p.id);

      // Call the cleanup API
      const response = await fetch("/api/admin/cleanup-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds: invoicesToDelete,
          keepPaymentId: invoiceToKeep?.id,
          updateData: {
            status: newStatus,
            amount_paid: newAmountPaid,
            amount_to_pay: 219000,
            paid_at:
              newStatus === "completed" ? new Date().toISOString() : null,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Payment cleaned up successfully");
        setShowManualCheckModal(false);
        setManualCheckResult(null);
        setManualEmail("");
        refetch();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cleanup payment");
      }
    } catch (error) {
      toast.error("Error cleaning up payment");
    } finally {
      setIsManualChecking(false);
    }
  };

  const handleSyncPaycashless = async (email: string) => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsManualChecking(true);
    try {
      const response = await fetch("/api/payments/sync-paycashless", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey: "admin123",
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.data.oldStatus !== result.data.newStatus) {
          toast.success("Payment status synced!", {
            description: `Updated from ${result.data.oldStatus} to ${result.data.newStatus}`,
          });
        } else {
          toast.success("Payment status checked", {
            description: "Status is already correct",
          });
        }

        refetch();
      } else {
        toast.error("Sync failed", {
          description: result.message || "An error occurred during sync",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Sync failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsManualChecking(false);
    }
  };

  return {
    manualEmail,
    setManualEmail,
    isManualChecking,
    manualCheckResult,
    showManualCheckModal,
    setShowManualCheckModal,
    handleManualPaymentCheck,
    handleUpdatePaymentStatus,
    handleSyncPaycashless,
  };
}
