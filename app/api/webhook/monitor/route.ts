import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");

    // Build query
    let query = supabaseAdmin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by action if specified
    if (action) {
      query = query.eq("action", action);
    }

    const { data: logs, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get webhook-specific logs
    const webhookLogs =
      logs?.filter(
        (log) =>
          log.action?.includes("webhook") ||
          log.action?.includes("payment") ||
          log.action?.includes("invoice")
      ) || [];

    // Get recent payment updates
    const { data: recentPayments, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("id, email, status, amount_paid, last_webhook_update, updated_at")
      .not("last_webhook_update", "is", null)
      .order("last_webhook_update", { ascending: false })
      .limit(10);

    if (paymentError) {
      console.error("Error fetching recent payments:", paymentError);
    }

    // Get webhook statistics
    const { data: webhookStats, error: statsError } = await supabaseAdmin
      .from("activity_logs")
      .select("action")
      .in("action", [
        "partial_payment_received",
        "invoice_fully_paid",
        "webhook_error",
      ]);

    if (statsError) {
      console.error("Error fetching webhook stats:", statsError);
    }

    const stats = {
      totalWebhooks: webhookStats?.length || 0,
      successfulWebhooks:
        webhookStats?.filter((s) => !s.action.includes("error")).length || 0,
      failedWebhooks:
        webhookStats?.filter((s) => s.action.includes("error")).length || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        webhookLogs,
        recentPayments: recentPayments || [],
        stats,
        environment: {
          webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/paycashless`,
          hasApiSecret: !!process.env.PAYCASHLESS_API_SECRET,
          hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        },
      },
    });
  } catch (error) {
    console.error("Webhook monitor error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testWebhook } = await request.json();

    if (testWebhook) {
      // Simulate a webhook test
      const testData = {
        timestamp: new Date().toISOString(),
        test: true,
        message: "Test webhook received",
      };

      // Log test webhook
      await supabaseAdmin.from("activity_logs").insert({
        action: "webhook_test",
        resource_type: "webhook",
        resource_id: "test",
        metadata: testData,
      });

      return NextResponse.json({
        success: true,
        message: "Test webhook logged successfully",
        data: testData,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Invalid request. Send { testWebhook: true } to test.",
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
