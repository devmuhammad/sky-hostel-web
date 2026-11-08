import { Button } from "@/shared/components/ui/button";
import { Column } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Payment } from "@/shared/store/appStore";

export function getPaymentColumns(options?: {
  onRefund?: (payment: Payment) => void;
}): Column<Payment>[] {
  const columns: Column<Payment>[] = [
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
        <div>
          <div className="font-medium">
            ₦{payment.amount_paid?.toLocaleString() || "0"}
          </div>
          <div className="text-xs text-gray-500">
            of ₦{payment.amount_to_pay?.toLocaleString() || "255,700"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment: Payment) => (
        <div className="space-y-1">
          <StatusBadge status={payment.status} variant="payment" />
          {(payment.payment_source === "sponsored" ||
            payment.payment_source === "waived") && (
            <div className="text-xs font-medium text-emerald-700">Sponsored</div>
          )}
          {payment.session_label && (
            <div className="text-xs text-slate-500">{payment.session_label}</div>
          )}
          {payment.status === "refunded" && payment.refund_reason && (
            <div className="text-xs text-slate-500">{payment.refund_reason}</div>
          )}
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

  if (options?.onRefund) {
    columns.push({
      key: "actions",
      header: "Actions",
      render: (payment: Payment) =>
        payment.status === "refunded" ? (
          <span className="text-xs text-slate-400">Refunded</span>
        ) : payment.status === "failed" ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <Button
            onClick={() => options.onRefund?.(payment)}
            className="h-8 bg-white px-3 text-xs text-red-700 border border-red-200 hover:bg-red-50"
          >
            Refund
          </Button>
        ),
    });
  }

  return columns;
}
