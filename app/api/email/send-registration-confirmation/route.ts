import { NextRequest, NextResponse } from "next/server";
import { resend, EMAIL_CONFIG } from "@/shared/config/resend";
import RegistrationConfirmationEmail from "@/shared/emails/registration-confirmation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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
      "registrationDate",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

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
        registrationDate,
        checkInDate,
        passportPhotoUrl,
      }),
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: data?.id,
        message: "Registration confirmation email sent successfully",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
