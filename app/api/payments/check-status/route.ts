import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getPaycashlessPaymentStatusForManualCheck } from "@/shared/utils/paycashless";

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

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const rawReference = typeof reference === "string" ? reference.trim() : "";

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
        paycashless_invoice_id,
        status,
        created_at,
        paid_at
      `
      )
      .order("created_at", { ascending: false });

    if (rawReference) {
      query = query.or(
        `invoice_id.eq."${rawReference}",paycashless_invoice_id.eq."${rawReference}"`
      );
    } else if (normalizedEmail) {
      query = query.ilike("email", normalizedEmail);
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
      normalizedEmail || email || "",
      phone
    );

    const foundOnPaycashless =
      paycashlessResult.success &&
      Boolean(
        paycashlessResult.data?.bestInvoice ||
          (paycashlessResult.data?.totalPaid || 0) > 0 ||
          (paycashlessResult.data?.payments || []).length > 0
      );

    if ((!payments || payments.length === 0) && foundOnPaycashless) {
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
