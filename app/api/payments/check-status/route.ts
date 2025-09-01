import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import {
  verifyPaycashlessPayment,
  getPaycashlessPaymentStatusForManualCheck,
} from "@/shared/utils/paycashless";

export async function POST(request: NextRequest) {
  try {
    const { email, phone, reference } = await request.json();

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
    let query = supabaseAdmin
      .from("payments")
      .select(
        `
        id,
        email,
        phone,
        amount_paid,
        amount_to_pay,
        invoice_id,
        status,
        created_at,
        paid_at
      `
      )
      .order("created_at", { ascending: false });

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
      return NextResponse.json(
        {
          success: false,
          message: "Error checking payment status",
        },
        { status: 500 }
      );
    }

    const paycashlessResult = await getPaycashlessPaymentStatusForManualCheck(
      email || "",
      phone
    );

    if (
      (!payments || payments.length === 0) &&
      paycashlessResult.success &&
      paycashlessResult.data
    ) {
      return NextResponse.json({
        success: true,
        payment: null,
        paycashless: paycashlessResult.data,
        message: "Payment found on Paycashless but not in local database",
        hasPaycashlessOnly: true,
      });
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

    const latestPayment = payments[0];

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

    const response = {
      success: true,
      payment: {
        ...latestPayment,
        reference: latestPayment.invoice_id,
        statusMessage,
      },
      paycashless: paycashlessResult.success ? paycashlessResult.data : null,
      message: statusMessage,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
