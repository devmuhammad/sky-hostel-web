"use client";

import { useEffect, useMemo, useState } from "react";
import { usePaymentManagement } from "./hooks/usePaymentManagement";
import { useManualPaymentCheck } from "./hooks/useManualPaymentCheck";
import { ManualPaymentChecker } from "./components/ManualPaymentChecker";
import { PaymentActions } from "./components/PaymentActions";
import { ManualCheckModal } from "./components/ManualCheckModal";
import { SponsorPaymentForm } from "./components/SponsorPaymentForm";
import { DataTable } from "@/shared/components/ui/data-table";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { useAppStore } from "@/shared/store/appStore";
import { columns } from "./utils/tableColumns";
import { useToast } from "@/shared/hooks/useToast";
import {
  getAcademicSessionForDate,
  getCurrentAcademicSession,
} from "@/shared/config/academic-session";

export default function PaymentsPage() {
  const { payments, loading } = useAppStore();
  const paymentManagement = usePaymentManagement();
  const manualCheck = useManualPaymentCheck();
  const toast = useToast();
  const [role, setRole] = useState<string | null>(null);
  const [sessionLabel, setSessionLabel] = useState("all");
  const [activeSessionLabel, setActiveSessionLabel] = useState(
    getCurrentAcademicSession()
  );
  const [isReconciling, setIsReconciling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, sessionRes] = await Promise.all([
          fetch("/api/admin/users/me"),
          fetch("/api/settings/session"),
        ]);
        const meJson = await meRes.json();
        const sessionJson = await sessionRes.json();
        if (!cancelled && meRes.ok && meJson.success) {
          setRole(meJson.data?.role || null);
        }
        if (!cancelled && sessionJson.success && sessionJson.data?.label) {
          setActiveSessionLabel(sessionJson.data.label);
          setSessionLabel(sessionJson.data.label);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionOptions = useMemo(() => {
    const set = new Set<string>([
      activeSessionLabel,
      getCurrentAcademicSession(),
      "2026/2027",
      "2025/2026",
      "2024/2025",
    ]);
    for (const payment of payments) {
      if (payment.session_label) set.add(payment.session_label);
      else if (payment.created_at) {
        set.add(getAcademicSessionForDate(payment.created_at));
      }
    }
    return Array.from(set).sort().reverse();
  }, [payments, activeSessionLabel]);

  const filteredPayments = useMemo(() => {
    if (sessionLabel === "all") return payments;
    return payments.filter((payment) => {
      if (payment.session_label) {
        return payment.session_label === sessionLabel;
      }
      if (!payment.created_at) return false;
      return getAcademicSessionForDate(payment.created_at) === sessionLabel;
    });
  }, [payments, sessionLabel]);

  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch("/api/admin/payments/reconcile-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry_run: false }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Reconcile failed");
      }
      toast.success(
        json.message ||
          `Updated ${json.data?.updated || 0} payment(s) with invoice dates/sessions`
      );
      const refresh = await fetch("/api/payments");
      const refreshJson = await refresh.json();
      if (refresh.ok && refreshJson.success && refreshJson.payments) {
        useAppStore.getState().setPayments(refreshJson.payments);
      } else {
        // fallback: reload via supabase-backed store if GET isn't available
        window.location.reload();
      }
    } catch (error: any) {
      toast.error(error.message || "Reconcile failed");
    } finally {
      setIsReconciling(false);
    }
  };

  if (loading.payments) {
    return <TableLoadingSkeleton />;
  }

  return (
    <div className="p-4 lg:p-6 pb-8 lg:pb-12">
      <div className="mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Payments
          </h1>
          <p className="mt-2 text-gray-600 text-sm lg:text-base">
            Session-scoped payment tracking. Use &quot;Re-date from
            invoices&quot; once to fix historical Sync All imports (no deletes).
          </p>
        </div>

        {role === "super_admin" && <SponsorPaymentForm />}

        <ManualPaymentChecker
          email={manualCheck.manualEmail}
          onEmailChange={manualCheck.setManualEmail}
          onCheck={manualCheck.handleManualPaymentCheck}
          isChecking={manualCheck.isManualChecking}
        />

        <PaymentActions
          sessionLabel={sessionLabel}
          onSessionChange={setSessionLabel}
          sessionOptions={sessionOptions}
          onSyncAll={paymentManagement.syncAllPayments}
          isSyncingAll={paymentManagement.isSyncingAll}
          isRefetching={paymentManagement.isRefetching}
          showReconcile={role === "super_admin"}
          onReconcile={handleReconcile}
          isReconciling={isReconciling}
        />

        <DataTable
          data={filteredPayments}
          columns={columns}
          searchFields={["email"]}
          searchPlaceholder="Search by email..."
        />
      </div>

      <ManualCheckModal
        isOpen={manualCheck.showManualCheckModal}
        onClose={() => manualCheck.setShowManualCheckModal(false)}
        result={manualCheck.manualCheckResult}
        onUpdate={manualCheck.handleUpdatePaymentStatus}
        onSync={manualCheck.handleSyncPaycashless}
        isUpdating={manualCheck.isManualChecking}
        isSyncing={manualCheck.isManualChecking}
      />
    </div>
  );
}
