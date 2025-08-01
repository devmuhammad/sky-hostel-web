"use client";

import { Suspense, useState } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { DataTable } from "@/shared/components/ui/data-table";
import { CardContainer } from "@/shared/components/ui/card-container";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { TableLoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { Payment } from "@/shared/store/appStore";
import { useToast } from "@/shared/hooks/useToast";
import { useAppData } from "@/shared/hooks/useAppData";

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

export default function PaymentsPage() {
  const { payments, loading, setPayments } = useAppStore();
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [duplicatePayments, setDuplicatePayments] = useState<DuplicatePayment[]>([]);
  const [selectedPaymentsToDelete, setSelectedPaymentsToDelete] = useState<string[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isCheckingPaycashless, setIsCheckingPaycashless] = useState(false);
  const [paycashlessData, setPaycashlessData] = useState<Record<string, PaycashlessPaymentInfo>>({});
  const toast = useToast();
  const { refetch } = useAppData();

  // Find duplicate payments by email
  const findDuplicatePayments = () => {
    const emailGroups = new Map<string, Payment[]>();
    
    payments.forEach(payment => {
      if (!emailGroups.has(payment.email)) {
        emailGroups.set(payment.email, []);
      }
      emailGroups.get(payment.email)!.push(payment);
    });

    const duplicates: DuplicatePayment[] = [];
    
    emailGroups.forEach((paymentsForEmail, email) => {
      if (paymentsForEmail.length > 1) {
        const hasPartialPayment = paymentsForEmail.some(p => p.status === "partially_paid");
        const hasFullPayment = paymentsForEmail.some(p => p.status === "completed");
        const totalPending = paymentsForEmail.filter(p => p.status === "pending").length;
        
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
          recommendedAction
        });
      }
    });

    setDuplicatePayments(duplicates);
    setShowCleanupModal(true);
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
          setPaycashlessData(prev => ({
            ...prev,
            [email]: {
              invoiceId: result.paycashless.payment_id || "Unknown",
              totalPaid: result.paycashless.totalPaid || 0,
              remainingAmount: result.paycashless.remainingAmount || 0,
              isFullyPaid: result.paycashless.isFullyPaid || false,
              hasPartialPayment: (result.paycashless.totalPaid || 0) > 0 && !result.paycashless.isFullyPaid,
              status: result.paycashless.isFullyPaid ? "Fully Paid" : (result.paycashless.totalPaid > 0 ? "Partially Paid" : "No Payments")
            }
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
        toast.success(`Successfully deleted ${selectedPaymentsToDelete.length} duplicate payments!`);
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
      render: (payment: Payment) => (
        <div>{payment.phone}</div>
      ),
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
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          payment.status === "completed" ? "bg-green-100 text-green-800" :
          payment.status === "partially_paid" ? "bg-yellow-100 text-yellow-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {payment.status}
        </div>
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all student payments
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Total Payments: {payments.length}
          </div>
          <Button
            onClick={findDuplicatePayments}
            className="bg-orange-600 hover:bg-orange-700"
          >
            🔍 Find Duplicate Payments
          </Button>
        </div>

        <CardContainer>
          <DataTable
            data={payments}
            columns={columns}
            searchFields={["email", "phone", "invoice_id"]}
          />
        </CardContainer>

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
                          {duplicate.payments.length} payments • {duplicate.recommendedAction}
                        </p>
                        {paycashlessInfo && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <p><strong>Paycashless Status:</strong> {paycashlessInfo.status}</p>
                            <p><strong>Total Paid:</strong> ₦{paycashlessInfo.totalPaid.toLocaleString()}</p>
                            <p><strong>Remaining:</strong> ₦{paycashlessInfo.remainingAmount.toLocaleString()}</p>
                            <p><strong>Paycashless Invoice:</strong> {paycashlessInfo.invoiceId}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        {duplicate.hasFullPayment && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Has Full Payment</span>
                        )}
                        {duplicate.hasPartialPayment && (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Has Partial Payment</span>
                        )}
                        {duplicate.totalPending > 0 && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {duplicate.totalPending} Pending
                          </span>
                        )}
                        {paycashlessInfo?.hasPartialPayment && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Has Paycashless Payments</span>
                        )}
                      </div>
                    </div>

                    {!paycashlessInfo && (
                      <div className="mb-3">
                        <Button
                          onClick={() => checkPaycashlessPayments(duplicate.email)}
                          disabled={isCheckingPaycashless}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isCheckingPaycashless ? "Checking..." : "🔍 Check Paycashless Status"}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {duplicate.payments.map((payment) => {
                        const shouldKeep = paycashlessInfo?.hasPartialPayment && 
                          payment.invoice_id === paycashlessInfo.invoiceId;
                        
                        return (
                          <div key={payment.id} className={`flex items-center justify-between p-2 rounded ${
                            shouldKeep ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={payment.id}
                                checked={selectedPaymentsToDelete.includes(payment.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPaymentsToDelete(prev => [...prev, payment.id]);
                                  } else {
                                    setSelectedPaymentsToDelete(prev => prev.filter(id => id !== payment.id));
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
                                  ₦{payment.amount_paid?.toLocaleString() || "0"} • {payment.status} • {new Date(payment.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === "completed" ? "bg-green-100 text-green-800" :
                              payment.status === "partially_paid" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {payment.status}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={() => setShowCleanupModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCleanup}
                disabled={selectedPaymentsToDelete.length === 0 || isCleaningUp}
                className="bg-red-600 hover:bg-red-700"
              >
                {isCleaningUp ? "Cleaning Up..." : `Delete ${selectedPaymentsToDelete.length} Payments`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
