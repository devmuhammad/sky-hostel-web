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

    const verificationResult = await verifyPaycashlessPayment(email, phone);

    // Payment verify API - verification completed

    // If verification failed, structure the error properly
    if (!verificationResult.success && verificationResult.error) {
      // Payment verify API - Error case
      return NextResponse.json({
        success: false,
        error: { message: verificationResult.error },
      });
    }

    return NextResponse.json(verificationResult);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Verification failed",
        },
      },
      { status: 500 }
    );
  }
}
