import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const { paymentIds, action } = await request.json();

    console.log("=== ADMIN PAYMENT FIX ===");
    console.log("Action:", action);
    console.log("Payment IDs:", paymentIds);

    if (action === "mark_completed") {
      // Update specified payments to completed
      const { data, error } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .in("id", paymentIds)
        .select();

      if (error) {
        console.error("Error updating payments:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Log the fix
      for (const payment of data) {
        await supabaseAdmin.from("activity_logs").insert({
          action: "payment_status_fixed",
          resource_type: "payment",
          resource_id: payment.id,
          metadata: {
            old_status: "pending",
            new_status: "completed",
            fixed_by: "admin_endpoint",
            reason: "webhook_fix_retroactive",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${data.length} payments to completed`,
        updatedPayments: data,
      });
    }

    if (action === "list_pending") {
      // List all pending payments for review
      const { data, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        pendingPayments: data,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin fix error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
