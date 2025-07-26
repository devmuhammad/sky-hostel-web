"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CardContainer, EmptyState } from "@/shared/components/ui";
import { Button } from "@/shared/components/ui/button";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

interface StudentData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  room?: {
    room_number?: string;
    room_name?: string;
    price_per_year?: number;
  };
  amount_paid?: number;
  payment_status?: string;
  registration_date?: string;
  check_in_date?: string;
}

export default function RegistrationSuccess() {
  const [mounted, setMounted] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure component is mounted before accessing search params
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchStudentData = async () => {
      // Only use URLSearchParams after mounting
      const searchParams = new URLSearchParams(window.location.search);
      const email = searchParams.get("email");
      const phone = searchParams.get("phone");

      if (!email && !phone) {
        setError("Missing registration information");
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (phone) params.append("phone", phone);

        const response = await fetch(`/api/students?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.student) {
          setStudentData(result.student);
        } else {
          setError(result.message || "Student data not found");
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Failed to load registration information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [mounted]);

  const handlePrint = () => {
    window.print();
  };

  // Show loading state until mounted
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Loading registration confirmation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Registration Information Not Found"
            description={error}
            action={
              <Link href="/registration">
                <Button>Go to Registration</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="No Registration Data"
            description="Unable to retrieve your registration information."
            action={
              <Link href="/registration">
                <Button>Start Registration</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-lg text-gray-600">
            Welcome to Sky Student Hostel, {studentData.name}!
          </p>
        </div>

        {/* Student Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Registration ID
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {studentData.id || "N/A"}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Room Assignment
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              {studentData.room?.room_number || "Pending"}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Payment Status
            </h3>
            <p
              className={`text-2xl font-bold ${studentData.payment_status === "completed" ? "text-green-600" : "text-yellow-600"}`}
            >
              {studentData.payment_status === "completed" ? "Paid" : "Pending"}
            </p>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Personal Information */}
          <CardContainer title="Personal Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <p className="mt-1 text-sm text-gray-900">{studentData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.phone}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registration Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.registration_date
                    ? new Date(
                        studentData.registration_date
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContainer>

          {/* Room & Payment Information */}
          <CardContainer title="Room & Payment Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room Number
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.room?.room_number || "To be assigned"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Room Type
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.room?.room_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Annual Fee
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  ₦{studentData.room?.price_per_year?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount Paid
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  ₦{studentData.amount_paid?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Check-in Date
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {studentData.check_in_date
                    ? new Date(studentData.check_in_date).toLocaleDateString()
                    : "TBD"}
                </p>
              </div>
            </div>
          </CardContainer>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            Print Registration Details
          </Button>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto px-8 py-3">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Important Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Important Information
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Please keep this registration confirmation for your records.
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              You will receive an email with check-in instructions shortly.
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              For any questions, contact us at support@skystudenhostel.com
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Check-in begins 2 weeks before the academic session starts.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
