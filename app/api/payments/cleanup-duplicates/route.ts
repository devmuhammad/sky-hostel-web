import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { verifyPaycashlessPayment } from "@/shared/utils/paycashless";

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json();

    // Simple admin key check
    if (adminKey !== "admin123") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Find all payments for this email
    const { data: payments, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Database error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message: "Error fetching payments",
        },
        { status: 500 }
      );
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No payments found for this email",
        },
        { status: 404 }
      );
    }

    // Check Paycashless for actual payment status
    const paycashlessResult = await verifyPaycashlessPayment(email);

    // Determine the correct status based on Paycashless data
    let correctStatus = "pending";
    let correctAmountPaid = 0;

    if (paycashlessResult.success && paycashlessResult.data) {
      if (paycashlessResult.data.isFullyPaid) {
        correctStatus = "completed";
        correctAmountPaid = paycashlessResult.data.totalPaid;
      } else if (paycashlessResult.data.totalPaid > 0) {
        correctStatus = "partially_paid";
        correctAmountPaid = paycashlessResult.data.totalPaid;
      }
    }

    // Keep the most recent payment and update it with correct data
    const paymentToKeep = payments[0];
    const paymentsToDelete = payments.slice(1);

    // Update the payment to keep
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: correctStatus,
        amount_paid: correctAmountPaid,
        paid_at:
          correctStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", paymentToKeep.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Delete duplicate payments
    if (paymentsToDelete.length > 0) {
      const paymentIdsToDelete = paymentsToDelete.map((p) => p.id);

      const { error: deleteError } = await supabaseAdmin
        .from("payments")
        .delete()
        .in("id", paymentIdsToDelete);

      if (deleteError) {
        console.error("Failed to delete duplicate payments:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete duplicate payments" },
          { status: 500 }
        );
      }
    }

    // Log the cleanup activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "cleanup_duplicate_payments",
      resource_type: "payment",
      resource_id: paymentToKeep.id,
      metadata: {
        email,
        payments_found: payments.length,
        payments_deleted: paymentsToDelete.length,
        old_status: paymentToKeep.status,
        new_status: correctStatus,
        old_amount_paid: paymentToKeep.amount_paid,
        new_amount_paid: correctAmountPaid,
        paycashless_data: paycashlessResult.data,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment cleanup completed",
      data: {
        email,
        payments_found: payments.length,
        payments_deleted: paymentsToDelete.length,
        payment_kept: {
          id: paymentToKeep.id,
          old_status: paymentToKeep.status,
          new_status: correctStatus,
          old_amount_paid: paymentToKeep.amount_paid,
          new_amount_paid: correctAmountPaid,
        },
        paycashless_data: paycashlessResult.data,
      },
    });
  } catch (error) {
    console.error("Payment cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
