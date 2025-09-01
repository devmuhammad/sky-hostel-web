import { Payment } from "@/shared/store/appStore";
import { StatusBadge } from "@/shared/components/ui/status-badge";

export const columns = [
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
          of ₦{payment.amount_to_pay?.toLocaleString() || "219,000"}
        </div>
      </div>
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
