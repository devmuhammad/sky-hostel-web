import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { action, email, invoice_id } = body;

    if (action === "mark_completed_by_email" && email) {
      const { data, error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("email", email)
        .eq("status", "pending")
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${data?.length || 0} payment(s) for ${email}`,
        data,
      });
    }

    if (action === "mark_completed_by_invoice" && invoice_id) {
      const { data, error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("invoice_id", invoice_id)
        .eq("status", "pending")
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated payment for invoice ${invoice_id}`,
        data,
      });
    }

    if (action === "test_webhook" && invoice_id) {
      // Simulate webhook payload
      const webhookPayload = {
        data: {
          reference: invoice_id,
          status: "paid",
          customer: {
            email: email || "test@example.com",
          },
        },
      };

      // Call the webhook endpoint internally
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`;
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      const result = await response.json();

      return NextResponse.json({
        success: true,
        message: `Tested webhook for invoice ${invoice_id}`,
        webhook_response: result,
      });
    }

    if (action === "fix_pending_payments") {
      // Find all pending payments with amount_paid > 0 and update them to completed
      const { data, error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("status", "pending")
        .gt("amount_paid", 0)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${data?.length || 0} pending payments to completed`,
        data,
      });
    }

    if (action === "debug_payment" && invoice_id) {
      // Debug: Find payment details
      const { data: payment, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("invoice_id", invoice_id)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Payment details for invoice ${invoice_id}`,
        payment,
      });
    }

    if (action === "list_pending_payments") {
      // List all pending payments
      const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Found ${payments?.length || 0} pending payments`,
        payments,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
