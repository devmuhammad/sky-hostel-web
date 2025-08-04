import { NextRequest, NextResponse } from "next/server";
import { getAllPaycashlessInvoices } from "@/shared/utils/paycashless";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const cursor = searchParams.get("cursor") || undefined;
    const status = searchParams.get("status") ? searchParams.get("status")!.split(",") : undefined;
    const currency = searchParams.get("currency") ? searchParams.get("currency")!.split(",") : undefined;
    const reference = searchParams.get("reference") || undefined;
    const acceptPartialPayments = searchParams.get("acceptPartialPayments") ? 
      searchParams.get("acceptPartialPayments") === "true" : undefined;
    const number = searchParams.get("number") || undefined;
    const createdAtGte = searchParams.get("createdAtGte") ? parseInt(searchParams.get("createdAtGte")!) : undefined;
    const createdAtLte = searchParams.get("createdAtLte") ? parseInt(searchParams.get("createdAtLte")!) : undefined;
    const createdAtLt = searchParams.get("createdAtLt") ? parseInt(searchParams.get("createdAtLt")!) : undefined;
    const createdAtGt = searchParams.get("createdAtGt") ? parseInt(searchParams.get("createdAtGt")!) : undefined;

    const result = await getAllPaycashlessInvoices({
      limit,
      cursor,
      status,
      currency,
      reference,
      acceptPartialPayments,
      number,
      createdAtGte,
      createdAtLte,
      createdAtLt,
      createdAtGt,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to fetch invoices",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("Error fetching Paycashless invoices:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
} 