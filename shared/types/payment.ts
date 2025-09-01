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
  event: string;
  data: PaycashlessWebhookData;
}

export interface PaycashlessWebhookData {
  id?: string;
  reference?: string;
  amount?: number;
  amountPaid?: number;
  amountRemaining?: number;
  status?: string;
  currency?: string;
  customerId?: string;
  invoiceId?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
