"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CardContainer,
  StatsCard,
  EmptyState,
  LoadingSkeleton,
} from "@/shared/components/ui";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks";

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  course: string;
  level: string;
  faculty: string;
  department: string;
  block: string;
  room: string;
  bedspace_label: string;
  state_of_origin: string;
  passport_photo_url?: string;
  created_at: string;
}

export default function RegistrationSuccess() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const studentId = searchParams.get("student_id");
  const toast = useToast();

  useEffect(() => {
    if (!studentId) {
      setError("Invalid registration link");
      setIsLoading(false);
      return;
    }

    fetchStudentData();
  }, [studentId]);

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || "Failed to fetch student data"
        );
      }

      setStudentData(result.data);
    } catch (error: any) {
      setError(error.message);
      toast.error("Error loading confirmation details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsImage = async () => {
    try {
      // Simple approach: encourage screenshot
      toast.info("Save Confirmation", {
        description:
          "Take a screenshot or print this page to save your confirmation details",
        duration: 6000,
      });
    } catch (error) {
      toast.error("Unable to save image");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSkeleton className="h-8 w-64 mb-6" />
          <div className="space-y-6">
            <LoadingSkeleton className="h-96" />
            <LoadingSkeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Registration Not Found"
            description={error || "Unable to find your registration details"}
            action={
              <Link href="/registration">
                <Button>Start New Registration</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 print:mb-6">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg inline-block mb-4 print:bg-transparent print:border print:border-green-800">
            <h1 className="text-2xl font-bold">Registration Successful! 🎉</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Congratulations! Your hostel registration has been completed
            successfully. Please save this confirmation page for your records.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            🖨️ Print Confirmation
          </Button>
          <Button onClick={handleSaveAsImage} variant="outline">
            📱 Save Screenshot
          </Button>
          <Link href="/">
            <Button>🏠 Go to Homepage</Button>
          </Link>
        </div>

        {/* Registration Details */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student Photo & Basic Info */}
          <div className="lg:col-span-1">
            <CardContainer>
              <div className="text-center space-y-4">
                {studentData.passport_photo_url ? (
                  <img
                    src={studentData.passport_photo_url}
                    alt="Student Photo"
                    className="w-32 h-32 rounded-lg object-cover mx-auto border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-200 mx-auto flex items-center justify-center text-gray-500">
                    📷 No Photo
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {studentData.first_name} {studentData.last_name}
                  </h2>
                  <p className="text-gray-600">{studentData.matric_number}</p>
                </div>
              </div>
            </CardContainer>

            {/* Room Assignment */}
            <CardContainer className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🏠 Room Assignment
              </h3>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {studentData.block} - {studentData.room}
                  </div>
                  <div className="text-blue-700">
                    Bedspace: {studentData.bedspace_label}
                  </div>
                </div>
                <div className="text-sm text-gray-600 text-center">
                  <p>📍 Please note your room details</p>
                  <p>🗝️ Collect your key from the hostel office</p>
                </div>
              </div>
            </CardContainer>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2">
            {/* Personal Information */}
            <CardContainer className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                👤 Personal Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Full Name
                  </label>
                  <p className="font-medium">
                    {studentData.first_name} {studentData.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Matric Number
                  </label>
                  <p className="font-medium">{studentData.matric_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  <p className="font-medium">{studentData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone Number
                  </label>
                  <p className="font-medium">{studentData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    State of Origin
                  </label>
                  <p className="font-medium">{studentData.state_of_origin}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Registration Date
                  </label>
                  <p className="font-medium">
                    {new Date(studentData.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </div>
            </CardContainer>

            {/* Academic Information */}
            <CardContainer className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎓 Academic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Faculty
                  </label>
                  <p className="font-medium">{studentData.faculty}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Department
                  </label>
                  <p className="font-medium">{studentData.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Course
                  </label>
                  <p className="font-medium">{studentData.course}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Level
                  </label>
                  <p className="font-medium">{studentData.level}</p>
                </div>
              </div>
            </CardContainer>

            {/* Important Instructions */}
            <CardContainer>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Important Instructions
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">1.</span>
                  <p>
                    <strong>Save this page:</strong> Take a screenshot or print
                    this confirmation for your records.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">2.</span>
                  <p>
                    <strong>Room Key:</strong> Visit the hostel office with this
                    confirmation to collect your room key.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">3.</span>
                  <p>
                    <strong>Check-in:</strong> Present this confirmation during
                    check-in procedures.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-green-600 font-bold">4.</span>
                  <p>
                    <strong>Contact:</strong> For any issues, contact the hostel
                    office with your matric number:{" "}
                    <strong>{studentData.matric_number}</strong>
                  </p>
                </div>
              </div>
            </CardContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200 print:border-gray-400">
          <p className="text-sm text-gray-500">
            Sky Student Hostel Management System • Generated on{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Keep this confirmation safe - you may need it for future reference
          </p>
        </div>
      </div>
    </div>
  );
}
