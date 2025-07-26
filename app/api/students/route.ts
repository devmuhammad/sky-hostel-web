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

      // Verify the bedspace is still available
      const { data: roomData, error: roomError } = await supabaseAdmin
        .from("rooms")
        .select("available_beds")
        .eq("id", data.room_id)
        .single();

      if (roomError || !roomData) {
        throw new Error("Room not found");
      }

      if (!roomData.available_beds.includes(data.bedspace_label)) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Bedspace no longer available" },
          },
          { status: 400 }
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

      // Update room availability (remove the selected bedspace)
      const updatedBeds = roomData.available_beds.filter(
        (bed: string) => bed !== data.bedspace_label
      );

      const { error: updateRoomError } = await supabaseAdmin
        .from("rooms")
        .update({ available_beds: updatedBeds })
        .eq("id", data.room_id);

      if (updateRoomError) {
        throw new Error("Failed to update room availability");
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
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Registration failed" } },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(rateLimiters.registration, handlePOST);
