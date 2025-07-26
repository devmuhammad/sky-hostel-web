import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { env } from "@/shared/config/env";

export async function GET() {
  const startTime = Date.now();

  const checks = {
    environment: "unknown",
    database: "unknown",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  try {
    // Check environment variables
    checks.environment =
      env.NODE_ENV === "production" ? "production" : "healthy";

    // Check database connection
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.from("payments").select("id").limit(1);
      checks.database = error ? "unhealthy" : "healthy";
    } catch (error) {
      checks.database = "unhealthy";
    }

    const responseTime = Date.now() - startTime;
    const isHealthy =
      checks.database === "healthy" && checks.environment !== "unknown";

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        version: process.env.npm_package_version || "unknown",
        environment: env.NODE_ENV,
        responseTime: `${responseTime}ms`,
        checks,
      },
      { status: isHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: "Health check failed",
        checks,
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 503 }
    );
  }
}
