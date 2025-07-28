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

export interface PaycashlessInvoiceRequest {
  reference: string;
  description: string;
  currency: "NGN" | "USD";
  customer: {
    email: string;
    name: string;
    address?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    description: string;
    price: number; // Amount in kobo (smallest currency unit)
  }>;
  daysUntilDue: number;
  acceptPartialPayments?: boolean;
  sendEmail?: boolean;
  autoFinalize?: boolean;
  callbackUrl?: string;
  returnUrl?: string;
  maxInstallments?: number;
  metadata?: Record<string, any>;
}

export interface PaycashlessInvoiceResponse {
  success: boolean;
  data: {
    id: string;
    reference: string;
    status: "draft" | "open" | "paid" | "partially_paid" | "cancelled";
    customerId: string;
    description: string;
    currency: string;
    dueDate: string;
    liveMode: boolean;
    number: string;
    amountDue: number;
    amountPaid: number;
    totalInclusiveTaxAmount: number;
    totalExclusiveTaxAmount: number;
    taxRateIds: string[];
    items: Array<{
      name: string;
      quantity: number;
      description: string;
      price: number;
    }>;
    hostedInvoiceUrl: string;
    maxInstallments?: number;
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
