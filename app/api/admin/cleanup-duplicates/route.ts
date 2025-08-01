import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { paymentIds } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "No payment IDs provided" },
        { status: 400 }
      );
    }

    console.log("Cleaning up duplicate payments:", paymentIds);

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
      resource_id: paymentIds[0], // Use first ID as representative
      metadata: {
        deleted_payment_ids: paymentIds,
        deleted_count: paymentIds.length,
        deleted_payments: deletedPayments,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${paymentIds.length} duplicate payments`,
      deleted_count: paymentIds.length,
      deleted_payments: deletedPayments,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
