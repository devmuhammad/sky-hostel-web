"use client";

import { Modal } from "@/shared/components/ui/modal";
import { Button } from "@/shared/components/ui/button";
import { Payment } from "@/shared/store/appStore";

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

interface ManualCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ManualCheckResult | null;
  onUpdate: () => void;
  onSync: (email: string) => void;
  isUpdating: boolean;
  isSyncing: boolean;
}

export function ManualCheckModal({
  isOpen,
  onClose,
  result,
  onUpdate,
  onSync,
  isUpdating,
  isSyncing,
}: ManualCheckModalProps) {
  if (!result) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Status Check Result"
      size="lg"
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Email: {result.email}</h4>

          {result.paycashlessData ? (
            <div className="space-y-2">
              <p>
                <strong>Paycashless Status:</strong>{" "}
                {result.paycashlessData.status}
              </p>
              <p>
                <strong>Total Paid:</strong> ₦
                {result.paycashlessData.totalPaid.toLocaleString()}
              </p>
              <p>
                <strong>Remaining:</strong> ₦
                {result.paycashlessData.remainingAmount.toLocaleString()}
              </p>
              <p>
                <strong>Invoice ID:</strong> {result.paycashlessData.invoiceId}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">
              No payment data found on Paycashless
            </p>
          )}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">Local Invoices Found</h4>
          <p className="text-sm text-gray-600 mb-2">
            {result.localPayments.length} invoice(s) found for this email
          </p>
          {result.localPayments.length > 0 && (
            <div className="text-sm space-y-2">
              {result.localPayments.map((payment, index) => (
                <div key={payment.id} className="p-2 bg-white rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p>
                        <strong>Invoice:</strong> {payment.invoice_id}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <span
                          className={`ml-1 px-2 py-1 rounded text-xs ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "partially_paid"
                                ? "bg-orange-100 text-orange-800"
                                : payment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </p>
                      <p>
                        <strong>Amount:</strong> ₦
                        {payment.amount_paid?.toLocaleString() || "0"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {payment.paid_at && (
                        <p>
                          Paid: {new Date(payment.paid_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {result.paycashlessData && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium mb-2">Paycashless Payment Data</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    result.paycashlessData.isFullyPaid
                      ? "bg-green-100 text-green-800"
                      : result.paycashlessData.hasPartialPayment
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {result.paycashlessData.status}
                </span>
              </p>
              <p>
                <strong>Total Paid:</strong> ₦
                {result.paycashlessData.totalPaid.toLocaleString()}
              </p>
              <p>
                <strong>Remaining Amount:</strong> ₦
                {result.paycashlessData.remainingAmount.toLocaleString()}
              </p>
              <p>
                <strong>Invoice ID:</strong> {result.paycashlessData.invoiceId}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Close
          </Button>

          <Button
            onClick={() => onSync(result.email)}
            disabled={isSyncing}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            {isSyncing ? "Syncing..." : "🔄 Sync with Paycashless"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
