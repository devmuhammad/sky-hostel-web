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
  amount: number;
  email: string;
  phone: string;
  name: string;
  description?: string;
  callbackUrl?: string;
  returnUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaycashlessInvoiceResponse {
  success: boolean;
  data: {
    id: string;
    reference: string;
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
