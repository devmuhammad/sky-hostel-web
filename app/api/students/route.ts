import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/shared/config/auth";
import { withRateLimit, rateLimiters } from "@/shared/utils/rate-limit";

interface StudentRegistrationData {
  // Personal Information
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  address: string;
  state_of_origin: string;
  lga: string;
  marital_status: string;
  religion: string;

  // Academic Information
  matric_number: string;
  course: string;
  level: string;
  faculty: string;
  department: string;

  // Next of Kin Information
  next_of_kin_name: string;
  next_of_kin_phone: string;
  next_of_kin_email: string;
  next_of_kin_relationship: string;

  // Accommodation Information
  block: string;
  room: string;
  bedspace_label: string;

  // System Information
  payment_id: string;
  room_id: string;

  // File Storage
  passport_photo_url?: string;
}

async function handlePOST(request: NextRequest) {
  try {
    const data: StudentRegistrationData = await request.json();

    // Validate required fields
    const requiredFields = [
      "first_name",
      "last_name",
      "matric_number",
      "email",
      "phone",
      "state_of_origin",
      "next_of_kin_name",
      "next_of_kin_phone",
      "next_of_kin_email",
      "next_of_kin_relationship",
      "block",
      "room",
      "bedspace_label",
      "payment_id",
      "room_id",
    ];

    for (const field of requiredFields) {
      if (!data[field as keyof StudentRegistrationData]) {
        return NextResponse.json(
          { success: false, error: { message: `${field} is required` } },
          { status: 400 }
        );
      }
    }

    const supabaseAdmin = await createServerSupabaseClient();

    try {
      // Check if matric number already exists
      const { data: existingStudent, error: checkError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("matric_number", data.matric_number)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error("Error checking existing student");
      }

      if (existingStudent) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Matric number already registered" },
          },
          { status: 400 }
        );
      }

      // Check if email already exists
      const { data: existingEmail, error: emailError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("email", data.email)
        .single();

      if (emailError && emailError.code !== "PGRST116") {
        throw new Error("Error checking existing email");
      }

      if (existingEmail) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Email address already registered" },
          },
          { status: 400 }
        );
      }

      // Check if phone already exists
      const { data: existingPhone, error: phoneError } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("phone", data.phone)
        .single();

      if (phoneError && phoneError.code !== "PGRST116") {
        throw new Error("Error checking existing phone");
      }

      if (existingPhone) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Phone number already registered" },
          },
          { status: 400 }
        );
      }

      // Verify bedspace is still available
      const { data: roomData, error: roomError } = await supabaseAdmin
        .from("rooms")
        .select("available_beds")
        .eq("id", data.room_id)
        .single();

      if (roomError || !roomData) {
        return NextResponse.json(
          { success: false, error: "Room not found" },
          { status: 404 }
        );
      }

      // Check if bedspace is still available
      if (!roomData.available_beds.includes(data.bedspace_label)) {
        return NextResponse.json(
          { success: false, error: "Bedspace no longer available" },
          { status: 409 }
        );
      }

      // Remove bedspace from available beds
      const updatedBeds = roomData.available_beds.filter(
        (bed: string) => bed !== data.bedspace_label
      );

      // Update room availability
      const { error: updateRoomError } = await supabaseAdmin
        .from("rooms")
        .update({ available_beds: updatedBeds })
        .eq("id", data.room_id);

      if (updateRoomError) {
        return NextResponse.json(
          { success: false, error: "Failed to update room availability" },
          { status: 500 }
        );
      }

      // Create student record with all new fields
      const { data: student, error: studentError } = await supabaseAdmin
        .from("students")
        .insert({
          // Personal Information
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          address: data.address,
          state_of_origin: data.state_of_origin,
          lga: data.lga,
          marital_status: data.marital_status,
          religion: data.religion,

          // Academic Information
          matric_number: data.matric_number,
          course: data.course,
          level: data.level,
          faculty: data.faculty,
          department: data.department,

          // Next of Kin Information
          next_of_kin_name: data.next_of_kin_name,
          next_of_kin_phone: data.next_of_kin_phone,
          next_of_kin_email: data.next_of_kin_email,
          next_of_kin_relationship: data.next_of_kin_relationship,

          // Accommodation
          block: data.block,
          room: data.room,
          bedspace_label: data.bedspace_label,

          // System Information
          payment_id: data.payment_id,

          // File Storage
          passport_photo_url: data.passport_photo_url,
        })
        .select()
        .single();

      if (studentError) {
        console.error("Student creation error:", studentError);
        throw new Error("Failed to create student record");
      }

      // Log the registration activity
      await supabaseAdmin.from("activity_logs").insert({
        action: "student_registered",
        resource_type: "student",
        resource_id: student.id,
        metadata: {
          block: data.block,
          room: data.room,
          bedspace: data.bedspace_label,
          payment_id: data.payment_id,
          full_name: `${data.first_name} ${data.last_name}`,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          student_id: student.id,
          message: "Registration successful",
        },
      });
    } catch (error: unknown) {
      console.error("Registration error:", error);
      throw error;
    }
  } catch (error: unknown) {
    console.error("Student registration error:", error);

    // Handle database constraint violations
    const dbError = error as { code?: string; constraint?: string };
    if (dbError?.code === "23505") {
      // PostgreSQL unique constraint violation
      let message = "Registration failed - duplicate data found";

      // Check which constraint was violated
      if (dbError.constraint?.includes("email")) {
        message = "Email address already registered";
      } else if (dbError.constraint?.includes("phone")) {
        message = "Phone number already registered";
      } else if (dbError.constraint?.includes("matric")) {
        message = "Matric number already registered";
      }

      return NextResponse.json(
        { success: false, error: { message } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: "Registration failed" } },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the POST handler
export const POST = handlePOST;

// GET handler for fetching student data
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const studentId = searchParams.get("student_id");

    if (!email && !phone && !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Email, phone, or student_id is required" },
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = await createServerSupabaseClient();

    let query = supabaseAdmin.from("students").select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        matric_number,
        course,
        level,
        faculty,
        department,
        block,
        room,
        bedspace_label,
        payment_id,
        passport_photo_url,
        created_at,
        payments(
          amount_paid,
          amount_to_pay,
          status,
          paid_at
        )
      `);

    if (studentId) {
      query = query.eq("id", studentId);
    } else if (email) {
      query = query.eq("email", email);
    } else if (phone) {
      query = query.eq("phone", phone);
    }

    const { data: students, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: { message: "Failed to fetch student data" } },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: "Student not found" } },
        { status: 404 }
      );
    }

    const student = students[0];

    // Handle both array and object responses from the join
    let payment = null;
    if (Array.isArray(student.payments)) {
      payment = student.payments[0];
    } else if (student.payments && typeof student.payments === "object") {
      payment = student.payments;
    }

    // If no payment found in the join, try to fetch it directly using payment_id
    let finalPayment = payment;
    if (!payment && student.payment_id) {
      const { data: directPayment, error: paymentError } = await supabaseAdmin
        .from("payments")
        .select("amount_paid, amount_to_pay, status, paid_at")
        .eq("id", student.payment_id)
        .single();

      if (directPayment && !paymentError) {
        finalPayment = directPayment;
      }
    }

    // Format the response
    const studentData = {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      phone: student.phone,
      matric_number: student.matric_number,
      course: student.course,
      level: student.level,
      faculty: student.faculty,
      department: student.department,
      room: {
        room_number: `${student.block}${student.room}`,
        room_name: `${student.block}${student.room}`,
        bedspace: student.bedspace_label,
      },
      amount_paid: finalPayment?.amount_paid || 0,
      amount_to_pay: finalPayment?.amount_to_pay || 219000,
      payment_status: finalPayment?.status || "pending",
      registration_date: student.created_at,
      passport_photo_url: student.passport_photo_url,
    };

    return NextResponse.json({
      success: true,
      student: studentData,
    });
  } catch (error) {
    console.error("Student fetch error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export const GET = handleGET;
