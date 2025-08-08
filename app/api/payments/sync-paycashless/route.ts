import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";

export async function POST(request: NextRequest) {
  try {
    const { email, adminKey } = await request.json();

    // Simple admin key check
    if (adminKey !== "admin123") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Get all Paycashless invoices
    const paycashlessResult = await getAllPaycashlessInvoices({
      limit: 100,
    });

    if (!paycashlessResult.success || !paycashlessResult.data) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch Paycashless invoices",
        },
        { status: 500 }
      );
    }

    // Find invoices for this email
    const relevantInvoices = paycashlessResult.data.invoices.filter(
      (invoice: any) => {
        const metadataEmail = invoice.customer?.email;
        const returnUrlEmail = extractEmailFromReturnUrl(invoice.returnUrl);

        console.log(`Checking invoice ${invoice.reference}:`, {
          metadataEmail,
          returnUrlEmail,
          searchEmail: email,
          status: invoice.status,
          amountPaid: invoice.totalPaid,
          amountDue: invoice.amount,
        });

        return metadataEmail === email || returnUrlEmail === email;
      }
    );

    console.log(`Found ${relevantInvoices.length} invoices for ${email}`);

    if (relevantInvoices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No invoices found for this email on Paycashless",
        },
        { status: 404 }
      );
    }

    // Find local payment record
    const { data: localPayments, error: fetchError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (fetchError || !localPayments || localPayments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No local payment record found for this email",
        },
        { status: 404 }
      );
    }

    const localPayment = localPayments[0];

    // Check if any invoice is actually paid
    const paidInvoices = relevantInvoices.filter(
      (invoice: any) =>
        invoice.status === "paid" ||
        invoice.status === "completed" ||
        (invoice.totalPaid > 0 && invoice.totalPaid >= invoice.amount)
    );

    console.log(`Found ${paidInvoices.length} paid invoices for ${email}`);

    if (paidInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No paid invoices found on Paycashless",
        data: {
          email,
          localStatus: localPayment.status,
          localAmountPaid: localPayment.amount_paid,
          paycashlessInvoices: relevantInvoices.map((inv: any) => ({
            reference: inv.reference,
            status: inv.status,
            totalPaid: inv.totalPaid,
            amount: inv.amount,
          })),
        },
      });
    }

    // Update local payment status based on Paycashless data
    const totalPaid = paidInvoices.reduce(
      (sum: number, invoice: any) => sum + invoice.totalPaid,
      0
    );

    const newStatus =
      totalPaid >= localPayment.amount_to_pay ? "completed" : "partially_paid";

    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: newStatus,
        amount_paid: totalPaid,
        paid_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", localPayment.id);

    if (updateError) {
      console.error("Failed to update payment:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Log the sync activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "sync_paycashless_payment",
      resource_type: "payment",
      resource_id: localPayment.id,
      metadata: {
        email,
        old_status: localPayment.status,
        new_status: newStatus,
        old_amount_paid: localPayment.amount_paid,
        new_amount_paid: totalPaid,
        paycashless_invoices: paidInvoices.map((inv: any) => ({
          reference: inv.reference,
          status: inv.status,
          totalPaid: inv.totalPaid,
        })),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment status synced with Paycashless",
      data: {
        email,
        oldStatus: localPayment.status,
        newStatus,
        oldAmountPaid: localPayment.amount_paid,
        newAmountPaid: totalPaid,
        paycashlessInvoices: paidInvoices.map((inv: any) => ({
          reference: inv.reference,
          status: inv.status,
          totalPaid: inv.totalPaid,
          amount: inv.amount,
        })),
      },
    });
  } catch (error) {
    console.error("Payment sync error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Helper function to extract email from returnUrl
function extractEmailFromReturnUrl(returnUrl?: string): string | undefined {
  if (!returnUrl) return undefined;

  try {
    const url = new URL(returnUrl);
    const email = url.searchParams.get("email");
    return email ? decodeURIComponent(email) : undefined;
  } catch (error) {
    console.error("Error parsing returnUrl:", error);
    return undefined;
  }
}
