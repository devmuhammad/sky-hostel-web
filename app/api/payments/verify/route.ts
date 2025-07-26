import { NextRequest, NextResponse } from "next/server";
import { verifyPaycashlessPayment } from "@/shared/utils/paycashless";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Email or phone number is required" },
        },
        { status: 400 }
      );
    }

    // Verify payment status with Paycashless and our database
    const verificationResult = await verifyPaycashlessPayment(email, phone);

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: verificationResult.error || "Payment verification failed",
          },
        },
        { status: 500 }
      );
    }

    const { totalPaid, remainingAmount, isFullyPaid, payments } =
      verificationResult.data!;

    // If not fully paid (less than required amount), return payment status
    if (!isFullyPaid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Payment incomplete. You have paid ₦${totalPaid.toLocaleString()}. Remaining balance: ₦${remainingAmount.toLocaleString()}`,
            code: "PARTIAL_PAYMENT",
          },
          data: {
            totalPaid,
            remainingAmount,
            isFullyPaid: false,
            payments,
          },
        },
        { status: 402 }
      ); // 402 Payment Required
    }

    // Check if payment has been used for registration
    const paymentIds = payments.map((p) => p.id);
    const { data: existingStudents, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("payment_id")
      .in("payment_id", paymentIds);

    if (studentsError) {
      console.error("Students query error:", studentsError);
      return NextResponse.json(
        {
          success: false,
          error: { message: "Failed to check registration status" },
        },
        { status: 500 }
      );
    }

    const usedPaymentIds = new Set(
      existingStudents?.map((s) => s.payment_id) || []
    );
    const hasUsedPayment = paymentIds.some((id) => usedPaymentIds.has(id));

    if (hasUsedPayment) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Payment has already been used for registration" },
        },
        { status: 409 }
      );
    }

    // Payment is fully completed and available for registration
    // Use the most recent payment as the primary payment for registration
    const primaryPayment = payments[0]; // payments are ordered by created_at desc

    return NextResponse.json({
      success: true,
      data: {
        payment_id: primaryPayment.id, // Add payment_id for registration
        totalPaid,
        remainingAmount: 0,
        isFullyPaid: true,
        email,
        phone,
        payments,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
