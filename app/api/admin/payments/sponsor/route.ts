import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { PAYMENT_CONFIG } from "@/shared/config/constants";
import { sanitizeEmail } from "@/shared/utils/sanitize";

/**
 * Super admin: waive payment for a sponsored student.
 * Creates a completed local payment so they can continue to registration
 * and room selection without Paycashless.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["super_admin"]);
    const body = await request.json();

    const email = sanitizeEmail(body.email || "");
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const firstName =
      typeof body.first_name === "string" ? body.first_name.trim() : "";
    const lastName =
      typeof body.last_name === "string" ? body.last_name.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: "Email and phone are required" },
        { status: 400 }
      );
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: "A sponsorship / waiver reason is required (min 5 characters).",
        },
        { status: 400 }
      );
    }

    const { data: existingStudent } = await supabaseAdmin
      .from("students")
      .select("id, is_active, account_status, email")
      .ilike("email", email)
      .maybeSingle();

    if (existingStudent) {
      if (
        existingStudent.is_active === false ||
        existingStudent.account_status === "blacklisted"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email belongs to a blacklisted student and cannot be sponsored.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "This email is already registered as a student. Sponsorship is only for new applicants.",
        },
        { status: 400 }
      );
    }

    const { data: existingPayments } = await supabaseAdmin
      .from("payments")
      .select("id, status, payment_source, invoice_id")
      .ilike("email", email)
      .order("created_at", { ascending: false });

    const completed = (existingPayments || []).find(
      (p) => p.status === "completed"
    );
    if (completed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A completed payment already exists for this email. They can proceed to registration.",
          data: { payment_id: completed.id },
        },
        { status: 400 }
      );
    }

    // Prefer converting an existing pending invoice into a sponsored waiver
    // so the email is not blocked by a leftover pending Paycashless row.
    const pending = (existingPayments || []).find(
      (p) => p.status === "pending" || p.status === "partially_paid"
    );

    const customerName = [firstName, lastName].filter(Boolean).join(" ").trim();
    const now = new Date().toISOString();
    const amount = PAYMENT_CONFIG.amount;

    let payment;

    if (pending) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: "completed",
          amount_to_pay: amount,
          amount_paid: amount,
          paid_at: now,
          payment_source: "sponsored",
          waiver_reason: reason,
          waived_by: admin.id,
          customer_name: customerName || null,
          phone,
        })
        .eq("id", pending.id)
        .select()
        .single();

      if (updateError) {
        console.error("Sponsor payment update error:", updateError);
        return NextResponse.json(
          {
            success: false,
            error:
              updateError.message?.includes("payment_source") ||
              updateError.code === "PGRST204"
                ? "Sponsored payment columns missing. Apply migration 13 first."
                : "Failed to update existing payment as sponsored",
          },
          { status: 500 }
        );
      }
      payment = updated;
    } else {
      const invoiceId = `SPONSORED-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      const { data: created, error: createError } = await supabaseAdmin
        .from("payments")
        .insert({
          email,
          phone,
          amount_to_pay: amount,
          amount_paid: amount,
          invoice_id: invoiceId,
          paycashless_invoice_id: null,
          status: "completed",
          paid_at: now,
          payment_source: "sponsored",
          waiver_reason: reason,
          waived_by: admin.id,
          customer_name: customerName || null,
        })
        .select()
        .single();

      if (createError) {
        console.error("Sponsor payment create error:", createError);
        return NextResponse.json(
          {
            success: false,
            error:
              createError.message?.includes("payment_source") ||
              createError.code === "PGRST204"
                ? "Sponsored payment columns missing. Apply migration 13 first."
                : "Failed to create sponsored payment",
          },
          { status: 500 }
        );
      }
      payment = created;
    }

    await supabaseAdmin.from("activity_logs").insert({
      action: "payment_sponsored",
      resource_type: "payment",
      resource_id: payment.id,
      admin_user_id: admin.id,
      metadata: {
        email,
        phone,
        reason,
        amount,
        customer_name: customerName || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payment,
        message:
          "Payment waived. The student can open /registration with this email and pick a room (no Paycashless required).",
        registration_hint: `/registration?email=${encodeURIComponent(email)}`,
      },
    });
  } catch (error) {
    console.error("Sponsor payment error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
