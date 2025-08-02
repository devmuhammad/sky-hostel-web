import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { resend, EMAIL_CONFIG } from "@/shared/config/resend";
import RegistrationConfirmationEmail from "@/shared/emails/registration-confirmation";

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    const supabaseAdmin = await createServerSupabaseClient();

    // Get student details
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Send registration confirmation email with all student details
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: [student.email],
      subject: "Welcome to Sky Student Hostel - Registration Confirmed!",
      react: RegistrationConfirmationEmail({
        studentName: `${student.first_name} ${student.last_name}`,
        matricNumber: student.matric_number,
        email: student.email,
        phone: student.phone,
        course: student.course || "Not specified",
        level: student.level,
        faculty: student.faculty,
        department: student.department || "Not specified",
        roomNumber: student.room,
        bedspace: student.bedspace || "Not assigned",
        block: student.block,
        amountPaid: student.amount_paid || 0,
        registrationDate: student.created_at,
        checkInDate: student.check_in_date,
        passportPhotoUrl: student.passport_photo_url,
      }),
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error("Email resend error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Log the email resend activity
    await supabaseAdmin.from("activity_logs").insert({
      action: "registration_email_resent",
      resource_type: "student",
      resource_id: student.id,
      metadata: {
        student_email: student.email,
        student_name: `${student.first_name} ${student.last_name}`,
        email_sent_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Registration email sent successfully",
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Error resending registration email:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
