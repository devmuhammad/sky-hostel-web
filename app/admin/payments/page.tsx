"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import Header from "@/features/dashboard/components/Header";
import { createClientSupabaseClient } from "@/shared/config/auth";
import { DataTable, Column, Filter } from "@/shared/components/ui/data-table";
import { Modal } from "@/shared/components/ui/modal";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { CardContainer } from "@/shared/components/ui/card-container";
import {
  StatsLoadingSkeleton,
  TableLoadingSkeleton,
} from "@/shared/components/ui/loading-skeleton";

interface Payment {
  id: string;
  email: string;
  phone: string;
  amount_paid: number;
  invoice_id: string;
  status: "pending" | "completed" | "failed";
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

function PaymentsStats({ payments }: { payments: Payment[] }) {
  const getTotalStats = () => {
    const total = payments.reduce((sum, p) => sum + p.amount_paid, 0);
    const completed = payments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount_paid, 0);
    const pending = payments.filter((p) => p.status === "pending").length;

    return { total, completed, pending };
  };

  const stats = getTotalStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-2xl font-semibold text-gray-900">
              ₦{stats.total.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-semibold text-gray-900">
              ₦{stats.completed.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.pending}
            </p>
          </div>
        </div>
      </CardContainer>
    </div>
  );
}

function PaymentsTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const supabase = createClientSupabaseClient();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Define table columns
  const columns: Column<Payment>[] = [
    {
      key: "invoice_id",
      header: "Invoice ID",
      render: (payment) => (
        <div className="text-sm font-medium text-gray-900">
          {payment.invoice_id}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (payment) => (
        <div>
          <div className="text-sm text-gray-900">{payment.email}</div>
          <div className="text-sm text-gray-500">{payment.phone}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (payment) => (
        <div className="text-sm font-medium text-gray-900">
          ₦{payment.amount_paid.toLocaleString()}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment) => (
        <StatusBadge status={payment.status} variant="payment" />
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (payment) => (
        <div>
          <div className="text-sm text-gray-900">
            {new Date(payment.created_at).toLocaleDateString()}
          </div>
          {payment.paid_at && (
            <div className="text-sm text-gray-500">
              Paid: {new Date(payment.paid_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
  ];

  // Define filters
  const filters: Filter[] = [
    {
      key: "status",
      label: "Filter by Status",
      options: [
        { value: "completed", label: "Completed" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];

  // Modal content for payment details
  const getPaymentDetailSections = (payment: Payment) => [
    {
      title: "Payment Information",
      items: [
        { label: "Invoice ID", value: payment.invoice_id },
        { label: "Amount", value: `₦${payment.amount_paid.toLocaleString()}` },
        {
          label: "Status",
          value: <StatusBadge status={payment.status} variant="payment" />,
        },
      ],
    },
    {
      title: "Customer Information",
      items: [
        { label: "Email", value: payment.email },
        { label: "Phone", value: payment.phone },
      ],
    },
    {
      title: "Timeline",
      items: [
        {
          label: "Created",
          value: new Date(payment.created_at).toLocaleString(),
        },
        ...(payment.paid_at
          ? [
              {
                label: "Paid",
                value: new Date(payment.paid_at).toLocaleString(),
              },
            ]
          : []),
        {
          label: "Last Updated",
          value: new Date(payment.updated_at).toLocaleString(),
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsLoadingSkeleton count={3} columns={3} />
        <TableLoadingSkeleton />
      </div>
    );
  }

  return (
    <>
      <PaymentsStats payments={payments} />

      <DataTable
        data={payments}
        columns={columns}
        loading={false}
        searchPlaceholder="Search by email, phone, or invoice ID..."
        searchFields={["email", "phone", "invoice_id"]}
        filters={filters}
        onRowAction={setSelectedPayment}
        actionLabel="View Details"
        title="Payments"
        emptyState={{
          title: "No payments found",
          description:
            "No payments have been made yet or try adjusting your search criteria.",
        }}
      />

      {/* Payment Details Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
        description="Complete payment information and timeline"
        size="lg"
      >
        {selectedPayment && (
          <DetailGrid
            sections={getPaymentDetailSections(selectedPayment)}
            columns={2}
          />
        )}
      </Modal>
    </>
  );
}

export default function PaymentsPage() {
  return (
    <>
      <Header
        title="Payments Management"
        subtitle="Track and manage all payment transactions"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Suspense
            fallback={
              <div className="space-y-6">
                <StatsLoadingSkeleton count={3} columns={3} />
                <TableLoadingSkeleton />
              </div>
            }
          >
            <PaymentsTable />
          </Suspense>
        </div>
      </div>
    </>
  );
}
