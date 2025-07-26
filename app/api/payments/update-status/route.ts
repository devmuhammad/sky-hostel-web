import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, phone, status, adminKey } = await request.json();

    // Simple admin key check (you should use proper auth in production)
    if (adminKey !== "admin123") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate input
    if (!email && !phone) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide either email or phone number",
        },
        { status: 400 }
      );
    }

    if (!["pending", "completed", "failed"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status. Use: pending, completed, or failed",
        },
        { status: 400 }
      );
    }

    // Find the payment
    let query = supabaseAdmin
      .from("payments")
      .select("id, email, phone, invoice_id, status")
      .order("created_at", { ascending: false });

    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq("email", email);
    } else if (phone) {
      query = query.eq("phone", phone);
    }

    const { data: payments, error: fetchError } = await query;

    if (fetchError || !payments || payments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        { status: 404 }
      );
    }

    const payment = payments[0];

    // Update payment status
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: status,
        paid_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to update payment status",
        },
        { status: 500 }
      );
    }

    // Log the activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "payment_status_updated_manually",
      resource_type: "payment",
      resource_id: payment.id,
      metadata: {
        old_status: payment.status,
        new_status: status,
        updated_by: "admin",
        method: "manual_update",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${status}`,
      payment: {
        id: payment.id,
        email: payment.email,
        phone: payment.phone,
        invoice_id: payment.invoice_id,
        old_status: payment.status,
        new_status: status,
      },
    });
  } catch (error) {
    console.error("Payment status update error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
