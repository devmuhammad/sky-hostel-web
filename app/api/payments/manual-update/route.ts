import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

interface ManualUpdateRequest {
  email: string;
  paycashlessData: {
    invoiceId: string;
    totalPaid: number;
    remainingAmount: number;
    isFullyPaid: boolean;
    hasPartialPayment: boolean;
    status: string;
  } | null;
  localPayments: any[];
}

export async function POST(request: NextRequest) {
  try {
    const { email, paycashlessData, localPayments }: ManualUpdateRequest =
      await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("Manual payment update request:", {
      email,
      paycashlessData,
      localPaymentsCount: localPayments.length,
    });

    // If no Paycashless data, we can't update
    if (!paycashlessData) {
      return NextResponse.json(
        { error: "No Paycashless data available for update" },
        { status: 400 }
      );
    }

    let updateResult = null;
    let message = "";

    if (localPayments.length === 0) {
      // No local payment found - create new payment record
      const newPayment = {
        email,
        phone: "", // We don't have phone from Paycashless data
        amount_paid: paycashlessData.totalPaid,
        invoice_id: paycashlessData.invoiceId,
        status: paycashlessData.isFullyPaid ? "completed" : "partially_paid",
        paid_at: new Date().toISOString(),
      };

      const { data: createdPayment, error: createError } = await supabaseAdmin
        .from("payments")
        .insert(newPayment)
        .select()
        .single();

      if (createError) {
        console.error("Error creating payment:", createError);
        return NextResponse.json(
          { error: "Failed to create payment record" },
          { status: 500 }
        );
      }

      updateResult = createdPayment;
      message = `Created new payment record for ${email} with amount ₦${paycashlessData.totalPaid.toLocaleString()}`;
    } else {
      // Update existing payment(s)
      const paymentIds = localPayments.map((p) => p.id);

      // Determine new status
      let newStatus = "pending";
      if (paycashlessData.isFullyPaid) {
        newStatus = "completed";
      } else if (paycashlessData.hasPartialPayment) {
        newStatus = "partially_paid";
      }

      const updateData = {
        amount_paid: paycashlessData.totalPaid,
        status: newStatus,
        paid_at: paycashlessData.isFullyPaid ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedPayments, error: updateError } = await supabaseAdmin
        .from("payments")
        .update(updateData)
        .in("id", paymentIds)
        .select();

      if (updateError) {
        console.error("Error updating payments:", updateError);
        return NextResponse.json(
          { error: "Failed to update payment records" },
          { status: 500 }
        );
      }

      updateResult = updatedPayments;
      message = `Updated ${updatedPayments.length} payment record(s) for ${email}. New amount: ₦${paycashlessData.totalPaid.toLocaleString()}, Status: ${newStatus}`;
    }

    // Log the manual update activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "manual_payment_update",
      resource_type: "payment",
      resource_id: updateResult?.id || email,
      metadata: {
        email,
        paycashless_data: paycashlessData,
        local_payments_count: localPayments.length,
        update_result: updateResult,
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
      updated_payment: updateResult,
    });
  } catch (error) {
    console.error("Manual payment update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
