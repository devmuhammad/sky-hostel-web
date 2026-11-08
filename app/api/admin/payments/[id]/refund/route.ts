import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import {
  processRefund,
  REFUND_ADMIN_ROLES,
} from "@/shared/utils/payment-refund";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole([...REFUND_ADMIN_ROLES]);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason : "";

    const result = await processRefund({
      paymentId: id,
      reason,
      adminId: admin.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Refund payment error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
