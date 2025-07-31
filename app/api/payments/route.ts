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

    // Check if a payment already exists for this email
    const { data: existingPayments, error: checkError } = await supabaseAdmin
      .from("payments")
      .select("id, status, created_at, invoice_id")
      .eq("email", data.email)
      .order("created_at", { ascending: false });

    if (existingPayments && existingPayments.length > 0 && !checkError) {
      // Check if there's a completed payment
      const completedPayment = existingPayments.find(
        (p) => p.status === "completed"
      );
      if (completedPayment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `A payment has already been completed for this email (${data.email}). Please contact support if you need assistance.`,
            },
          },
          { status: 400 }
        );
      }

      // Check if there's a recent pending payment (within last 24 hours)
      const recentPendingPayment = existingPayments.find((p) => {
        if (p.status !== "pending") return false;
        const paymentAge = Date.now() - new Date(p.created_at).getTime();
        const hoursSincePayment = paymentAge / (1000 * 60 * 60);
        return hoursSincePayment < 24;
      });

      if (recentPendingPayment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `A payment is already in progress for this email (${data.email}). Please complete your existing payment or wait 24 hours before trying again.`,
            },
          },
          { status: 400 }
        );
      }

      // If there are old pending payments, we can proceed but log it
      console.log(
        `Creating new payment for ${data.email} - ${existingPayments.length} existing payments found`
      );
    }

    // Generate unique reference
    const reference = `SKY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Direct redirect to registration after payment (simplified flow)
      // User goes: Payment -> Registration (skipping confirm-payment page)
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/registration?email=${encodeURIComponent(
        data.email
      )}&phone=${encodeURIComponent(data.phone)}&firstName=${encodeURIComponent(
        data.firstName
      )}&lastName=${encodeURIComponent(data.lastName)}`;

      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`;

      // Create invoice with Paycashless
      const invoiceResult = await createPaycashlessInvoice({
        reference,
        description: `Sky Student Hostel Payment - ${data.firstName} ${data.lastName}`,
        currency: "NGN",
        customer: {
          email: data.email,
          name: `${data.firstName} ${data.lastName}`,
          address: "Sky Student Hostel, University Campus Area",
        },
        items: [
          {
            name: "Hostel Accommodation Fee",
            description: "Annual accommodation fee for Sky Student Hostel",
            price: PAYMENT_CONFIG.amountInKobo, // Amount in kobo
            quantity: 1,
          },
        ],
        daysUntilDue: 65,
        acceptPartialPayments: true,
        sendEmail: true,
        autoFinalize: true,
        maxInstallments: 2,
        callbackUrl: callbackUrl,
        returnUrl: returnUrl,
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
