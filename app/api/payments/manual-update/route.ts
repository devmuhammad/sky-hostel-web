import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { action, email, invoice_id } = await request.json();

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
