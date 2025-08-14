import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { paymentIds, keepPaymentId, updateData } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "No payment IDs provided" },
        { status: 400 }
      );
    }

    // Cleaning up duplicate payments

    // Update the payment to keep if updateData is provided
    if (keepPaymentId && updateData) {
      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from("payments")
        .update(updateData)
        .eq("id", keepPaymentId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating kept payment:", updateError);
        return NextResponse.json(
          { error: "Failed to update kept payment" },
          { status: 500 }
        );
      }

      // Updated kept payment
    }

    // Delete the selected payments
    const { data: deletedPayments, error: deleteError } = await supabaseAdmin
      .from("payments")
      .delete()
      .in("id", paymentIds)
      .select();

    if (deleteError) {
      console.error("Error deleting payments:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete payments" },
        { status: 500 }
      );
    }

    // Log the cleanup activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "duplicate_payments_cleaned",
      resource_type: "payment",
      resource_id: keepPaymentId || paymentIds[0], // Use kept payment ID or first deleted ID
      metadata: {
        deleted_payment_ids: paymentIds,
        deleted_count: paymentIds.length,
        deleted_payments: deletedPayments,
        kept_payment_id: keepPaymentId,
        update_data: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${paymentIds.length} duplicate payments${keepPaymentId ? " and updated kept payment" : ""}`,
      deleted_count: paymentIds.length,
      deleted_payments: deletedPayments,
      kept_payment_id: keepPaymentId,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
