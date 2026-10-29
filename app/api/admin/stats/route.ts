import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { getDashboardStats } from "@/shared/utils/dashboard-stats";

export async function GET(request: NextRequest) {
  try {
    await requireRole(["super_admin", "admin", "hostel_manager", "accountant"]);
    const session = request.nextUrl.searchParams.get("session") || undefined;
    const stats = await getDashboardStats(session);
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("Admin access required") ||
      message.includes("Insufficient permissions") ||
      message.includes("No authenticated user")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load stats" },
      { status: 500 }
    );
  }
}
