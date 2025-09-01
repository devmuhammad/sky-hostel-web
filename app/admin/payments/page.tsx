"use client";

import { usePaymentManagement } from "./hooks/usePaymentManagement";
import { useManualPaymentCheck } from "./hooks/useManualPaymentCheck";
import { ManualPaymentChecker } from "./components/ManualPaymentChecker";
import { PaymentActions } from "./components/PaymentActions";
import { ManualCheckModal } from "./components/ManualCheckModal";
import { DataTable } from "@/shared/components/ui/data-table";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { useAppStore } from "@/shared/store/appStore";
import { columns } from "./utils/tableColumns";

export default function PaymentsPage() {
  const { payments, loading } = useAppStore();
  const paymentManagement = usePaymentManagement();
  const manualCheck = useManualPaymentCheck();

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
            Manage and track all student payments
          </p>
        </div>

        <ManualPaymentChecker
          email={manualCheck.manualEmail}
          onEmailChange={manualCheck.setManualEmail}
          onCheck={manualCheck.handleManualPaymentCheck}
          isChecking={manualCheck.isManualChecking}
        />

        <PaymentActions
          onSyncAll={paymentManagement.syncAllPayments}
          isSyncingAll={paymentManagement.isSyncingAll}
          isRefetching={paymentManagement.isRefetching}
        />

        <DataTable
          data={payments}
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
