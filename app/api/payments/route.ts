import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { createPaycashlessInvoice } from "@/shared/utils/paycashless";
import { withRateLimit, rateLimiters } from "@/shared/utils/rate-limit";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

interface PaymentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const data: PaymentData = await request.json();

    const requiredFields = ["firstName", "lastName", "email", "phone"];
    for (const field of requiredFields) {
      if (!data[field as keyof PaymentData]) {
        return NextResponse.json(
          { success: false, error: { message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    // Fixed amount for hostel accommodation
    const amount = PAYMENT_CONFIG.amount;

    const supabaseAdmin = await createServerSupabaseClient();

    // Generate unique reference
    const reference = `SKY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create invoice with Paycashless
      const invoiceResult = await createPaycashlessInvoice({
        reference,
        amount: amount,
        email: data.email,
        phone: data.phone,
        name: `${data.firstName} ${data.lastName}`,
        description: `Sky Student Hostel Payment - ${data.firstName} ${data.lastName}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/confirm-payment?ref=${reference}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone)}`,
        metadata: {
          phone: data.phone,
          firstName: data.firstName,
          lastName: data.lastName,
          orderType: "hostel_payment",
        },
      });

      if (!invoiceResult.success) {
        throw new Error("Failed to create invoice");
      }

      const invoice = invoiceResult.data;

      // Store payment record in Supabase
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
          email: data.email,
          phone: data.phone,
          amount_paid: amount,
          invoice_id: invoice.reference,
          status: "pending",
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Payment record creation error:", paymentError);
        throw new Error("Failed to create payment record");
      }

      // Log the payment initiation
      await supabaseAdmin.from("activity_logs").insert({
        action: "payment_initiated",
        resource_type: "payment",
        resource_id: payment.id,
        metadata: {
          amount: amount,
          email: data.email,
          phone: data.phone,
          invoice_id: invoice.id,
          reference,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          payment_id: payment.id,
          invoice_id: invoice.id,
          invoice_reference: invoice.reference,
          payment_url: invoice.paymentUrl,
          amount: amount,
          status: invoice.status,
          due_date: invoice.dueDate,
        },
      });
    } catch (error: any) {
      console.error("Payment creation error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Payment initiation failed" } },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(rateLimiters.payment, handlePOST);
