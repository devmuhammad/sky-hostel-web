import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_CONFIG } from "@/shared/config/resend";
import RegistrationConfirmationEmail from "@/shared/emails/registration-confirmation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Email API - Request received

    const {
      studentName,
      matricNumber,
      email,
      phone,
      course,
      level,
      faculty,
      department,
      roomNumber,
      bedspace,
      block,
      amountPaid,
      amountToPay,
      registrationDate,
      checkInDate,
      passportPhotoUrl,
    } = body;

    // Validate required fields
    const requiredFields = [
      "studentName",
      "matricNumber",
      "email",
      "phone",
      "course",
      "level",
      "faculty",
      "department",
      "roomNumber",
      "bedspace",
      "block",
      "amountPaid",
      "amountToPay",
      "registrationDate",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        // Email API - Missing required field
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Email API - All required fields present
      !!process.env.RESEND_API_KEY
    );

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_CONFIG.from.name} <${EMAIL_CONFIG.from.email}>`,
      to: [email],
      subject: "Welcome to Sky Student Hostel - Registration Confirmed!",
      react: RegistrationConfirmationEmail({
        studentName,
        matricNumber,
        email,
        phone,
        course,
        level,
        faculty,
        department,
        roomNumber,
        bedspace,
        block,
        amountPaid,
        amountToPay: body.amountToPay || 219000,
        registrationDate,
        checkInDate,
        passportPhotoUrl,
      }),
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      // Email API - Resend error occurred
      return NextResponse.json(
        { success: false, error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    // Email API - Email sent successfully

    return NextResponse.json({
      success: true,
      data: {
        messageId: data?.id,
        message: "Registration confirmation email sent successfully",
      },
    });
  } catch (error) {
    // Email API - Exception occurred
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
