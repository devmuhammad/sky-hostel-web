import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    // Log the raw webhook data
    const debugData = {
      timestamp: new Date().toISOString(),
      headers: {
        "Request-Signature": headers["request-signature"],
        "Request-Timestamp": headers["request-timestamp"],
        "Content-Type": headers["content-type"],
        "User-Agent": headers["user-agent"],
      },
      body: body,
      bodyLength: body.length,
      environment: {
        hasApiSecret: !!process.env.PAYCASHLESS_API_SECRET,
        hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    // Try to parse JSON
    let parsedBody;
    try {
      parsedBody = JSON.parse(body);
      debugData.parsedBody = parsedBody;
    } catch (error) {
      debugData.parseError =
        error instanceof Error ? error.message : "Unknown parse error";
    }

    // Test database connection
    try {
      const { data, error } = await supabaseAdmin
        .from("payments")
        .select("id")
        .limit(1);

      debugData.databaseTest = {
        success: !error,
        error: error?.message || null,
        hasData: !!data,
      };
    } catch (error) {
      debugData.databaseTest = {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown database error",
      };
    }

    // Log to activity_logs for persistence
    await supabaseAdmin.from("activity_logs").insert({
      action: "webhook_debug",
      resource_type: "webhook",
      resource_id: "debug",
      metadata: debugData,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook debug data logged",
      debugData,
    });
  } catch (error) {
    console.error("Webhook debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Webhook debug endpoint",
    usage: "POST webhook data here to debug issues",
    timestamp: new Date().toISOString(),
  });
}
