import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { action, paymentIds, email } = await request.json();

    if (action === "mark_completed_by_email" && email) {
      // Update payment by email
      const { error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (error) {
        return NextResponse.json(
          { success: false, error: "Failed to update payment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Payment for ${email} marked as completed`,
      });
    }

    if (!action || !paymentIds || !Array.isArray(paymentIds)) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }

    let updateData = {};
    if (action === "mark_completed") {
      updateData = {
        status: "completed",
        paid_at: new Date().toISOString(),
      };
    } else if (action === "mark_pending") {
      updateData = {
        status: "pending",
        paid_at: null,
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("payments")
      .update(updateData)
      .in("id", paymentIds);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to update payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Payments ${action} successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
