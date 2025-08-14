import { NextRequest, NextResponse } from "next/server";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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
              (invoice: Record<string, unknown>) => {
        const metadataEmail = invoice.customer?.email;
        const returnUrlEmail = extractEmailFromReturnUrl(invoice.returnUrl);

        // Checking invoice
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

    // Found relevant invoices

    return NextResponse.json({
      success: true,
      data: {
        email,
        totalInvoices: paycashlessResult.data.invoices.length,
        relevantInvoices: relevantInvoices.length,
        invoices: relevantInvoices.map((inv: Record<string, unknown>) => ({
          reference: inv.reference,
          status: inv.status,
          totalPaid: inv.totalPaid,
          amount: inv.amount,
          customerEmail: inv.customer?.email,
        })),
      },
    });
  } catch (error) {
    console.error("Debug error:", error);
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
