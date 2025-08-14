export interface PaycashlessCheckoutRequest {
  reference: string;
  amount: number;
  email: string;
  name: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface PaycashlessCheckoutResponse {
  success: boolean;
  data: {
    id: string;
    reference: string;
    authorizationUrl: string;
    amount: number;
    currency: string;
    returnUrl: string;
    expiresAt: string;
  };
  message: string;
}

// Paycashless API Response Types
export interface PaycashlessInvoice {
  id: string;
  reference: string;
  number: string;
  status: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  amount?: number;
  totalPaid?: number;
  remainingAmount?: number;
  customer?: {
    email?: string;
    phoneNumber?: string;
    name?: string;
  };
  metadata?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    orderType?: string;
  };
  returnUrl?: string;
  createdAt: string;
  dueDate: string;
  acceptPartialPayments: boolean;
  paidAt?: string;
}

export interface PaycashlessListResponse {
  success: boolean;
  data: PaycashlessInvoice[];
  hasMore?: boolean;
  cursor?: string;
  message?: string;
}

export interface PaycashlessWebhookData {
  id?: string;
  invoice_id?: string;
  invoiceId?: string;
  amount?: number;
  payment_amount?: number;
  status: string;
  customer?: {
    email?: string;
    phoneNumber?: string;
    phone?: string;
  };
  email?: string;
  phone?: string;
  paidAt?: string;
  event?: string;
}

export interface PaycashlessInvoiceRequest {
  reference: string;
  description: string;
  currency: string;
  customer: {
    email: string;
    name: string;
    address: string;
  };
  items: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
  }>;
  daysUntilDue: number;
  acceptPartialPayments?: boolean;
  sendEmail?: boolean;
  autoFinalize?: boolean;
  callbackUrl: string;
  returnUrl: string;
  maxInstallments?: number;
  metadata?: Record<string, any>;
}

export interface PaycashlessInvoiceResponse {
  success: boolean;
  data: {
    id: string;
    reference: string;
    paymentUrl: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    number: string;
  };
  message: string;
}

export interface PaycashlessWebhookPayload {
  id: string;
  invoice_id?: string; // For backward compatibility
  reference: string;
  amount: number;
  email: string;
  phone?: string;
  status:
    | "paid"
    | "pending"
    | "cancelled"
    | "draft"
    | "open"
    | "partially_paid";
  payment_date?: string;
  transaction_id?: string;
  paidAt?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
}

export interface PaymentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // amount removed - configured in PAYMENT_CONFIG constants
}
