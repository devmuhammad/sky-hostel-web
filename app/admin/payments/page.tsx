"use client";

import { useState, useEffect } from "react";
import Header from "@/features/dashboard/components/Header";
import { CardContainer } from "@/shared/components/ui/card-container";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";

interface Payment {
  id: string;
  email: string;
  phone: string;
  amount_paid: number;
  invoice_id: string;
  status: string;
  created_at: string;
  paid_at?: string;
}

interface DuplicateAnalysis {
  payment: Payment;
  paycashlessInvoice?: any;
  paycashlessPayments: any[];
  hasPayments: boolean;
  totalPaid: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [duplicateEmails, setDuplicateEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [analysis, setAnalysis] = useState<DuplicateAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchPayments();
    fetchDuplicateEmails();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/debug");
      const result = await response.json();
      if (result.success) {
        setPayments(result.payments || []);
      }
    } catch (error) {
      toast.error("Failed to fetch payments");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDuplicateEmails = async () => {
    try {
      const response = await fetch("/api/payments/manual-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_pending_payments" }),
      });
      const result = await response.json();
      
      if (result.success && result.payments) {
        // Find emails with multiple payments
        const emailCounts = result.payments.reduce((acc: any, payment: Payment) => {
          acc[payment.email] = (acc[payment.email] || 0) + 1;
          return acc;
        }, {});
        
        const duplicates = Object.keys(emailCounts).filter(email => emailCounts[email] > 1);
        setDuplicateEmails(duplicates);
      }
    } catch (error) {
      console.error("Failed to fetch duplicate emails:", error);
    }
  };

  const analyzeDuplicates = async () => {
    if (!selectedEmail) {
      toast.error("Please select an email to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/admin/cleanup-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze_duplicates", email: selectedEmail }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.analysis || []);
        toast.success(result.message);
      } else {
        toast.error(result.error || "Failed to analyze duplicates");
      }
    } catch (error) {
      toast.error("Failed to analyze duplicates");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!selectedEmail) {
      toast.error("Please select an email to cleanup");
      return;
    }

    setIsCleaning(true);
    try {
      const response = await fetch("/api/admin/cleanup-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cleanup_duplicates", email: selectedEmail }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        // Refresh data
        fetchPayments();
        fetchDuplicateEmails();
        setAnalysis([]);
        setSelectedEmail("");
      } else {
        toast.error(result.error || "Failed to cleanup duplicates");
      }
    } catch (error) {
      toast.error("Failed to cleanup duplicates");
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <>
      <Header
        title="Payment Management"
        subtitle="Manage payments and handle duplicate payments"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Duplicate Payment Cleanup */}
          <CardContainer title="Duplicate Payment Cleanup">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Email with Duplicates
                </label>
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select an email...</option>
                  {duplicateEmails.map((email) => (
                    <option key={email} value={email}>
                      {email} ({payments.filter(p => p.email === email).length} payments)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-4">
                <LoadingButton
                  onClick={analyzeDuplicates}
                  isLoading={isAnalyzing}
                  loadingText="Analyzing..."
                  disabled={!selectedEmail}
                >
                  Analyze Duplicates
                </LoadingButton>

                <LoadingButton
                  onClick={cleanupDuplicates}
                  isLoading={isCleaning}
                  loadingText="Cleaning..."
                  disabled={!selectedEmail || analysis.length === 0}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Cleanup Duplicates
                </LoadingButton>
              </div>

              {analysis.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Analysis Results</h3>
                  <div className="space-y-4">
                    {analysis.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Payment ID: {item.payment.id}</p>
                            <p className="text-sm text-gray-600">
                              Status: <StatusBadge status={item.payment.status} />
                            </p>
                            <p className="text-sm text-gray-600">
                              Created: {new Date(item.payment.created_at).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Paycashless Activity: {item.hasPayments ? "Yes" : "No"}
                            </p>
                            {item.hasPayments && (
                              <p className="text-sm text-gray-600">
                                Total Paid: ₦{item.totalPaid.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {item.paycashlessInvoice && (
                              <div>
                                <p className="text-sm font-medium">
                                  Invoice: {item.paycashlessInvoice.reference}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Status: {item.paycashlessInvoice.status}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContainer>

          {/* All Payments */}
          <CardContainer title="All Payments">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{payment.amount_paid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.invoice_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContainer>
        </div>
      </div>
    </>
  );
}
