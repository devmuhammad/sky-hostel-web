import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { 
  listPaycashlessInvoices, 
  getPaycashlessInvoicePayments, 
  cancelPaycashlessInvoice 
} from "@/shared/utils/paycashless-admin";

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json();

    if (action === "analyze_duplicates") {
      // Find duplicate payments
      const { data: duplicatePayments, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("email", email)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!duplicatePayments || duplicatePayments.length <= 1) {
        return NextResponse.json({
          success: true,
          message: "No duplicates found for this email",
          payments: duplicatePayments || [],
        });
      }

      // Get Paycashless invoices for this email
      const paycashlessResult = await listPaycashlessInvoices({
        limit: 100,
      });

      const paycashlessInvoices = paycashlessResult.data || [];
      const emailInvoices = paycashlessInvoices.filter(
        (invoice) => invoice.customer.email === email
      );

      // Analyze each payment
      const analysis = await Promise.all(
        duplicatePayments.map(async (payment) => {
          // Find corresponding Paycashless invoice
          const paycashlessInvoice = emailInvoices.find(
            (invoice) => invoice.reference === payment.invoice_id
          );

          let paycashlessPayments = [];
          if (paycashlessInvoice) {
            const paymentsResult = await getPaycashlessInvoicePayments(
              paycashlessInvoice.id
            );
            paycashlessPayments = paymentsResult.data || [];
          }

          return {
            payment,
            paycashlessInvoice,
            paycashlessPayments,
            hasPayments: paycashlessPayments.length > 0,
            totalPaid: paycashlessPayments.reduce((sum, p) => sum + p.amount, 0),
          };
        })
      );

      return NextResponse.json({
        success: true,
        message: `Found ${duplicatePayments.length} payments for ${email}`,
        analysis,
        duplicatePayments,
        paycashlessInvoices: emailInvoices,
      });
    }

    if (action === "cleanup_duplicates") {
      // Get analysis first
      const analysisResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/cleanup-duplicates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "analyze_duplicates", email }),
        }
      );

      const analysis = await analysisResponse.json();

      if (!analysis.success) {
        return NextResponse.json(analysis, { status: 500 });
      }

      const { analysis: paymentAnalysis } = analysis;

      // Find the best payment to keep (completed or with most payments)
      const completedPayments = paymentAnalysis.filter(
        (item: any) => item.payment.status === "completed"
      );

      const paymentsWithPaycashlessActivity = paymentAnalysis.filter(
        (item: any) => item.hasPayments
      );

      let paymentToKeep = null;
      let paymentsToCancel = [];

      if (completedPayments.length > 0) {
        // Keep the most recent completed payment
        paymentToKeep = completedPayments[0];
        paymentsToCancel = paymentAnalysis.filter(
          (item: any) => item.payment.id !== paymentToKeep.payment.id
        );
      } else if (paymentsWithPaycashlessActivity.length > 0) {
        // Keep the payment with the most Paycashless activity
        paymentToKeep = paymentsWithPaycashlessActivity.reduce((best, current) => {
          return current.totalPaid > best.totalPaid ? current : best;
        });
        paymentsToCancel = paymentAnalysis.filter(
          (item: any) => item.payment.id !== paymentToKeep.payment.id
        );
      } else {
        // Keep the most recent payment
        paymentToKeep = paymentAnalysis[0];
        paymentsToCancel = paymentAnalysis.slice(1);
      }

      // Cancel Paycashless invoices for payments to be removed
      const cancellationResults = await Promise.all(
        paymentsToCancel.map(async (item: any) => {
          if (item.paycashlessInvoice && item.paycashlessInvoice.status === "open") {
            const cancelResult = await cancelPaycashlessInvoice(
              item.paycashlessInvoice.id,
              "Duplicate payment cleanup - keeping payment with most activity"
            );
            return {
              paymentId: item.payment.id,
              invoiceId: item.paycashlessInvoice.id,
              cancelResult,
            };
          }
          return {
            paymentId: item.payment.id,
            invoiceId: null,
            cancelResult: { success: true, message: "No Paycashless invoice to cancel" },
          };
        })
      );

      // Update database to mark duplicate payments as cancelled
      const updateResults = await Promise.all(
        paymentsToCancel.map(async (item: any) => {
          const { error } = await supabaseAdmin
            .from("payments")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.payment.id);

          return {
            paymentId: item.payment.id,
            updateError: error,
          };
        })
      );

      // Log the cleanup activity
      await supabaseAdmin.from("activity_logs").insert({
        action: "duplicate_payment_cleanup",
        resource_type: "payment",
        resource_id: paymentToKeep.payment.id,
        metadata: {
          email,
          payments_kept: 1,
          payments_cancelled: paymentsToCancel.length,
          cancellation_results: cancellationResults,
          update_results: updateResults,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Cleaned up ${paymentsToCancel.length} duplicate payments for ${email}`,
        payment_kept: paymentToKeep,
        payments_cancelled: paymentsToCancel,
        cancellation_results: cancellationResults,
        update_results: updateResults,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 