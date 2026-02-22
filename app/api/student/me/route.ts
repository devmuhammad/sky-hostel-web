import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/config/supabase";
import { getAuthenticatedStudent } from "@/shared/server/student-auth";

const ALLOWED_PROFILE_FIELDS = [
  "phone",
  "address",
  "state_of_origin",
  "lga",
  "marital_status",
  "religion",
  "next_of_kin_name",
  "next_of_kin_phone",
  "next_of_kin_email",
  "next_of_kin_relationship",
] as const;

export async function GET() {
  try {
    const authStudent = await getAuthenticatedStudent();

    if (!authStudent) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { student } = authStudent;

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, invoice_id, amount_to_pay, amount_paid, status, paid_at")
      .eq("id", student.payment_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        payment,
      },
    });
  } catch (error) {
    console.error("Student profile fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authStudent = await getAuthenticatedStudent();

    if (!authStudent) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updates: Record<string, string> = {};

    for (const field of ALLOWED_PROFILE_FIELDS) {
      const value = body[field];
      if (typeof value === "string") {
        updates[field] = value.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields provided" },
        { status: 400 }
      );
    }

    const { data: updatedStudent, error } = await supabaseAdmin
      .from("students")
      .update(updates)
      .eq("id", authStudent.student.id)
      .select("*")
      .single();

    if (error) {
      console.error("Student profile update error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updatedStudent });
  } catch (error) {
    console.error("Student profile patch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
