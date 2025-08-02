"use client";

import { Suspense, useState } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { DataTable } from "@/shared/components/ui/data-table";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Payment } from "@/shared/store/appStore";
import { useToast } from "@/shared/hooks/useToast";
import { useAppData } from "@/shared/hooks/useAppData";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

interface DuplicatePayment {
  email: string;
  payments: Payment[];
  hasPartialPayment: boolean;
  hasFullPayment: boolean;
  totalPending: number;
  recommendedAction: string;
}

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
}

export default function PaymentsPage() {
  const { payments, loading, setPayments } = useAppStore();
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [duplicatePayments, setDuplicatePayments] = useState<
    DuplicatePayment[]
  >([]);
  const [selectedPaymentsToDelete, setSelectedPaymentsToDelete] = useState<
    string[]
  >([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isCheckingPaycashless, setIsCheckingPaycashless] = useState(false);
  const [paycashlessData, setPaycashlessData] = useState<
    Record<string, PaycashlessPaymentInfo>
  >({});
  const toast = useToast();
  const { refetch } = useAppData();

  // Manual payment checker states
  const [manualEmail, setManualEmail] = useState("");
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [manualCheckResult, setManualCheckResult] =
    useState<ManualCheckResult | null>(null);
  const [showManualCheckModal, setShowManualCheckModal] = useState(false);

  // Find duplicate payments by email
  const findDuplicatePayments = () => {
    const emailGroups = new Map<string, Payment[]>();

    payments.forEach((payment) => {
      if (!emailGroups.has(payment.email)) {
        emailGroups.set(payment.email, []);
      }
      emailGroups.get(payment.email)!.push(payment);
    });

    const duplicates: DuplicatePayment[] = [];

    emailGroups.forEach((paymentsForEmail, email) => {
      if (paymentsForEmail.length > 1) {
        const hasPartialPayment = paymentsForEmail.some(
          (p) => p.status === "partially_paid"
        );
        const hasFullPayment = paymentsForEmail.some(
          (p) => p.status === "completed"
        );
        const totalPending = paymentsForEmail.filter(
          (p) => p.status === "pending"
        ).length;

        let recommendedAction = "";
        if (hasFullPayment) {
          recommendedAction = "Keep completed payment, delete all others";
        } else if (hasPartialPayment) {
          recommendedAction = "Keep partial payment, delete pending duplicates";
        } else if (totalPending > 1) {
          recommendedAction = "Keep most recent pending, delete older pending";
        } else {
          recommendedAction = "No action needed";
        }

        duplicates.push({
          email,
          payments: paymentsForEmail,
          hasPartialPayment,
          hasFullPayment,
          totalPending,
          recommendedAction,
        });
      }
    });

    setDuplicatePayments(duplicates);
    setShowCleanupModal(true);
    return duplicates; // Return duplicates for the cleanup modal
  };

  // Check Paycashless for actual payment status
  const checkPaycashlessPayments = async (email: string) => {
    setIsCheckingPaycashless(true);
    try {
      const response = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.paycashless) {
          setPaycashlessData((prev) => ({
            ...prev,
            [email]: {
              invoiceId: result.paycashless.payment_id || "Unknown",
              totalPaid: result.paycashless.totalPaid || 0,
              remainingAmount: result.paycashless.remainingAmount || 0,
              isFullyPaid: result.paycashless.isFullyPaid || false,
              hasPartialPayment:
                (result.paycashless.totalPaid || 0) > 0 &&
                !result.paycashless.isFullyPaid,
              status: result.paycashless.isFullyPaid
                ? "Fully Paid"
                : result.paycashless.totalPaid > 0
                  ? "Partially Paid"
                  : "No Payments",
            },
          }));
          toast.success(`Found payment data for ${email}`);
        } else {
          toast.error(`No payment data found for ${email}`);
        }
      } else {
        toast.error("Failed to check Paycashless payments");
      }
    } catch (error) {
      toast.error("Error checking Paycashless payments");
    } finally {
      setIsCheckingPaycashless(false);
    }
  };

  const handleCleanup = async () => {
    if (selectedPaymentsToDelete.length === 0) {
      toast.error("Please select payments to delete");
      return;
    }

    setIsCleaningUp(true);
    try {
      const response = await fetch("/api/admin/cleanup-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds: selectedPaymentsToDelete,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Successfully deleted ${selectedPaymentsToDelete.length} duplicate payments!`
        );
        setShowCleanupModal(false);
        setSelectedPaymentsToDelete([]);
        setPaycashlessData({});

        // Refetch data instead of reloading the page
        await refetch();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      toast.error("Failed to cleanup payments");
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Manual payment status checker
  const handleManualPaymentCheck = async () => {
    if (!manualEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsManualChecking(true);
    try {
      // Check Paycashless status
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

      // Find local payments for this email
      const localPayments = payments.filter((p) => p.email === manualEmail);

      // Determine cleanup action based on Paycashless data
      let needsUpdate = false;
      let updateMessage = "";
      let cleanupAction = "";

      if (paycashlessData) {
        if (paycashlessData.isFullyPaid) {
          needsUpdate = true;
          updateMessage = `Paycashless shows fully paid (₦${paycashlessData.totalPaid.toLocaleString()})`;
          cleanupAction =
            "Keep one invoice, mark as completed, delete duplicates";
        } else if (paycashlessData.hasPartialPayment) {
          needsUpdate = true;
          updateMessage = `Paycashless shows partial payment (₦${paycashlessData.totalPaid.toLocaleString()})`;
          cleanupAction =
            "Keep one invoice, mark as partially paid, delete duplicates";
        } else {
          updateMessage = "No payments found on Paycashless";
          cleanupAction = "Keep most recent invoice, delete others";
        }
      } else {
        updateMessage = "No payment data found on Paycashless";
        cleanupAction = "Keep most recent invoice, delete others";
      }

      setManualCheckResult({
        email: manualEmail,
        paycashlessData,
        localPayments,
        needsUpdate,
        updateMessage,
        cleanupAction,
      });

      setShowManualCheckModal(true);
    } catch (error) {
      toast.error("Error checking payment status");
    } finally {
      setIsManualChecking(false);
    }
  };

  // Update payment status and cleanup duplicates
  const handleUpdatePaymentStatus = async () => {
    if (!manualCheckResult?.needsUpdate) return;

    setIsManualChecking(true);
    try {
      // Determine which invoice to keep based on Paycashless data
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

      // Keep the most recent invoice
      invoiceToKeep = manualCheckResult.localPayments.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      // Get IDs of invoices to delete (all except the one to keep)
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
        await refetch(); // Refresh data
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

  // Simulate webhook payment
  const handleSimulateWebhook = async (action: string) => {
    if (!manualEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsManualChecking(true);
    try {
      // Find payment by email
      const payment = payments.find((p) => p.email === manualEmail);

      if (!payment) {
        toast.error("No payment found for this email");
        return;
      }

      // Simulate webhook payload based on action
      let webhookPayload: any = {
        event:
          action === "simulate_partial_payment"
            ? "INVOICE_PAYMENT_SUCCEEDED"
            : "INVOICE_PAID",
        data: {
          invoice_id: payment.invoice_id,
          customer: {
            email: payment.email,
            phoneNumber: payment.phone,
          },
        },
      };

      if (action === "simulate_partial_payment") {
        const partialAmount = Math.min(
          50000,
          PAYMENT_CONFIG.amount - (payment.amount_paid || 0)
        );
        if (partialAmount <= 0) {
          toast.error("Payment is already fully paid");
          return;
        }
        webhookPayload.data.amount = partialAmount;
      }

      // Call the actual webhook endpoint to process the payment
      const response = await fetch("/api/webhook/paycashless", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Webhook simulation successful");
        // Refresh the payments data to get the updated payment from database
        await refetch();

        // Get the updated payment for the modal
        const updatedPayments = useAppStore.getState().payments;
        const updatedPayment = updatedPayments.find(
          (p) => p.email === manualEmail
        );

        if (updatedPayment) {
          setManualCheckResult({
            email: manualEmail,
            paycashlessData: null,
            localPayments: [updatedPayment],
            needsUpdate: false,
            updateMessage: result.message || "Webhook simulation completed",
            cleanupAction: "Webhook simulation completed",
          });
          setShowManualCheckModal(true);
        }
      } else {
        toast.error(result.message || "Failed to simulate webhook");
      }
    } catch (error) {
      console.error("Webhook simulation error:", error);
      toast.error("Failed to simulate webhook");
    } finally {
      setIsManualChecking(false);
    }
  };

  const columns = [
    {
      key: "email",
      header: "Email",
      render: (payment: Payment) => (
        <div className="font-medium">{payment.email}</div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (payment: Payment) => <div>{payment.phone}</div>,
    },
    {
      key: "amount_paid",
      header: "Amount Paid",
      render: (payment: Payment) => (
        <div>₦{payment.amount_paid?.toLocaleString() || "0"}</div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment: Payment) => (
        <StatusBadge status={payment.status} variant="payment" />
      ),
    },
    {
      key: "invoice_id",
      header: "Invoice ID",
      render: (payment: Payment) => (
        <div className="font-mono text-sm">{payment.invoice_id}</div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (payment: Payment) => (
        <div>{new Date(payment.created_at).toLocaleDateString()}</div>
      ),
    },
  ];

  if (loading.payments) {
    return <TableLoadingSkeleton />;
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Payments
          </h1>
          <p className="mt-2 text-gray-600 text-sm lg:text-base">
            Manage and track all student payments
          </p>
        </div>

        {/* Manual Payment Checker */}
        <CardContainer>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Manual Payment Status Checker
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Check and update payment status for a specific email address
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="manual-email">Email Address</Label>
                <Input
                  id="manual-email"
                  type="email"
                  placeholder="Enter student email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleManualPaymentCheck}
                disabled={isManualChecking || !manualEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isManualChecking ? "Checking..." : "🔍 Check Status"}
              </Button>
            </div>

            {/* Webhook Simulation Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Simulate webhook payments (for testing):
              </p>
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <Button
                  onClick={() =>
                    handleSimulateWebhook("simulate_partial_payment")
                  }
                  disabled={isManualChecking || !manualEmail.trim()}
                  variant="outline"
                  className="text-orange-600 border-orange-600 hover:bg-orange-50 w-full sm:w-auto"
                >
                  {isManualChecking
                    ? "Processing..."
                    : "💰 Simulate Partial Payment"}
                </Button>
                <Button
                  onClick={() => handleSimulateWebhook("simulate_full_payment")}
                  disabled={isManualChecking || !manualEmail.trim()}
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50 w-full sm:w-auto"
                >
                  {isManualChecking
                    ? "Processing..."
                    : "✅ Simulate Full Payment"}
                </Button>
              </div>
            </div>
          </div>
        </CardContainer>

        {/* Duplicate Payments Cleanup */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold">All Payments</h2>
          <Button
            onClick={() => {
              const duplicates = findDuplicatePayments();
              setDuplicatePayments(duplicates);
              setShowCleanupModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          >
            🧹 Cleanup Duplicates
          </Button>
        </div>

        <DataTable
          data={payments}
          columns={columns}
          searchFields={["email"]}
          searchPlaceholder="Search by email..."
        />
      </div>

      {/* Manual Check Modal */}
      <Modal
        isOpen={showManualCheckModal}
        onClose={() => setShowManualCheckModal(false)}
        title="Payment Status Check Result"
        size="lg"
      >
        {manualCheckResult && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">
                Email: {manualCheckResult.email}
              </h4>

              {manualCheckResult.paycashlessData ? (
                <div className="space-y-2">
                  <p>
                    <strong>Paycashless Status:</strong>{" "}
                    {manualCheckResult.paycashlessData.status}
                  </p>
                  <p>
                    <strong>Total Paid:</strong> ₦
                    {manualCheckResult.paycashlessData.totalPaid.toLocaleString()}
                  </p>
                  <p>
                    <strong>Remaining:</strong> ₦
                    {manualCheckResult.paycashlessData.remainingAmount.toLocaleString()}
                  </p>
                  <p>
                    <strong>Invoice ID:</strong>{" "}
                    {manualCheckResult.paycashlessData.invoiceId}
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
                {manualCheckResult.localPayments.length} invoice(s) found for
                this email
              </p>
              {manualCheckResult.localPayments.length > 0 && (
                <div className="text-sm">
                  <p>
                    <strong>Action Required:</strong>{" "}
                    {manualCheckResult.cleanupAction}
                  </p>
                </div>
              )}
            </div>

            {manualCheckResult.needsUpdate && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Cleanup Required
                </h4>
                <p className="text-yellow-700">
                  {manualCheckResult.updateMessage}
                </p>
                <p className="text-yellow-700 mt-2">
                  <strong>Recommended Action:</strong>{" "}
                  {manualCheckResult.cleanupAction}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
              <Button
                onClick={() => setShowManualCheckModal(false)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              {manualCheckResult.needsUpdate && (
                <Button
                  onClick={handleUpdatePaymentStatus}
                  disabled={isManualChecking}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {isManualChecking ? "Cleaning up..." : "🧹 Cleanup & Update"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cleanup Modal */}
      <Modal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        title="Duplicate Payments Cleanup"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Found {duplicatePayments.length} emails with duplicate payments.
            Select which payments to delete:
          </p>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {duplicatePayments.map((duplicate, index) => {
              const paycashlessInfo = paycashlessData[duplicate.email];
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{duplicate.email}</h4>
                      <p className="text-sm text-gray-500">
                        {duplicate.payments.length} payments •{" "}
                        {duplicate.recommendedAction}
                      </p>
                      {paycashlessInfo && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <p>
                            <strong>Paycashless Status:</strong>{" "}
                            {paycashlessInfo.status}
                          </p>
                          <p>
                            <strong>Total Paid:</strong> ₦
                            {paycashlessInfo.totalPaid.toLocaleString()}
                          </p>
                          <p>
                            <strong>Remaining:</strong> ₦
                            {paycashlessInfo.remainingAmount.toLocaleString()}
                          </p>
                          <p>
                            <strong>Paycashless Invoice:</strong>{" "}
                            {paycashlessInfo.invoiceId}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      {duplicate.hasFullPayment && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          Has Full Payment
                        </span>
                      )}
                      {duplicate.hasPartialPayment && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Has Partial Payment
                        </span>
                      )}
                      {duplicate.totalPending > 0 && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {duplicate.totalPending} Pending
                        </span>
                      )}
                      {paycashlessInfo?.hasPartialPayment && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Has Paycashless Payments
                        </span>
                      )}
                    </div>
                  </div>

                  {!paycashlessInfo && (
                    <div className="mb-3">
                      <Button
                        onClick={() =>
                          checkPaycashlessPayments(duplicate.email)
                        }
                        disabled={isCheckingPaycashless}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isCheckingPaycashless
                          ? "Checking..."
                          : "🔍 Check Paycashless Status"}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {duplicate.payments.map((payment) => {
                      const shouldKeep =
                        paycashlessInfo?.hasPartialPayment &&
                        payment.invoice_id === paycashlessInfo.invoiceId;

                      return (
                        <div
                          key={payment.id}
                          className={`flex items-center justify-between p-2 rounded ${
                            shouldKeep
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={payment.id}
                              checked={selectedPaymentsToDelete.includes(
                                payment.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPaymentsToDelete((prev) => [
                                    ...prev,
                                    payment.id,
                                  ]);
                                } else {
                                  setSelectedPaymentsToDelete((prev) =>
                                    prev.filter((id) => id !== payment.id)
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <div>
                              <div className="font-medium text-sm">
                                {payment.invoice_id}
                                {shouldKeep && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">
                                    KEEP (Has Payments)
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₦{payment.amount_paid?.toLocaleString() || "0"}{" "}
                                • {payment.status} •{" "}
                                {new Date(
                                  payment.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <StatusBadge
                            status={payment.status}
                            variant="payment"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowCleanupModal(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCleanup}
              disabled={selectedPaymentsToDelete.length === 0 || isCleaningUp}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {isCleaningUp
                ? "Cleaning Up..."
                : `Delete ${selectedPaymentsToDelete.length} Payments`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
