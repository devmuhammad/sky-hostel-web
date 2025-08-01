import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { verifyPaycashlessPayment } from "@/shared/utils/paycashless";

export async function POST(request: NextRequest) {
  try {
    const { email, phone, reference } = await request.json();

    // Validate input - at least one field is required
    if (!email && !phone && !reference) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide either email, phone number, or payment reference",
        },
        { status: 400 }
      );
    }

    // Build query based on provided fields
    let query = supabaseAdmin
      .from("payments")
      .select(
        `
        id,
        email,
        phone,
        amount_paid,
        invoice_id,
        status,
        created_at,
        paid_at
      `
      )
      .order("created_at", { ascending: false });

    // Add filters based on provided fields
    if (reference) {
      query = query.eq("invoice_id", reference);
    } else if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq("email", email);
    } else if (phone) {
      query = query.eq("phone", phone);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Error checking payment status",
        },
        { status: 500 }
      );
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No payment found with the provided information",
        },
        { status: 404 }
      );
    }

    // Check Paycashless for actual payment status
    const paycashlessResult = await verifyPaycashlessPayment(email || "", phone);

    // Return the most recent payment with Paycashless data
    const latestPayment = payments[0];

    // Add user-friendly status message
    let statusMessage = "";
    switch (latestPayment.status) {
      case "completed":
        statusMessage = "Payment completed successfully";
        break;
      case "pending":
        statusMessage = "Payment is being processed";
        break;
      case "failed":
        statusMessage = "Payment failed";
        break;
      default:
        statusMessage = "Payment status unknown";
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...latestPayment,
        reference: latestPayment.invoice_id,
        statusMessage,
      },
      paycashless: paycashlessResult.success ? paycashlessResult.data : null,
      message: statusMessage,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
