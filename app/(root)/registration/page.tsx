"use client";

import { useState, useEffect } from "react";
import PaymentVerification from "@/features/registration/components/PaymentVerification";
import RegistrationForm from "@/features/registration/components/RegistrationForm";
import { PassportPhotoUpload } from "@/shared/components/ui/passport-photo-upload";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function RegistrationPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<
    "payment" | "photo" | "registration"
  >("payment");
  const [passportPhotoUrl, setPassportPhotoUrl] = useState<string | null>(null);

  // Ensure component is mounted before accessing search params
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const searchParams = new URLSearchParams(window.location.search);
      const email = searchParams.get("email");
      const phone = searchParams.get("phone");
      const firstName = searchParams.get("firstName");
      const lastName = searchParams.get("lastName");
      const verified = searchParams.get("verified");

      // Pre-fill data from URL parameters
      if (email || phone) {
        setPaymentData({
          email: email || "",
          phone: phone || "",
          firstName: firstName || "",
          lastName: lastName || "",
        });
      }

      // Only auto-verify if explicitly verified=true
      if (verified === "true" && (email || phone)) {
        setPaymentData({
          email: email || "",
          phone: phone || "",
          firstName: firstName || "",
          lastName: lastName || "",
        });
        setCurrentStep("photo");
      }
    }
  }, [mounted]);

  // Show loading state until mounted
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Student Registration
        </h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold text-center mb-8">
        SKY Hostel Application 2025/2026
      </h1>

      {/* Show success message when coming from payment */}
      {paymentData && paymentData.payment_id && (
        <div className="max-w-md mx-auto mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-green-600"
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
            <div>
              <h3 className="text-green-800 font-semibold">
                Payment Verified!
              </h3>
              <p className="text-green-700 text-sm">
                Complete your registration below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Verification Warning */}
      {currentStep === "payment" && !paymentData && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${currentStep === "payment" ? "text-blue-600" : currentStep === "photo" ? "text-green-600" : "text-gray-400"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "payment" ? "bg-blue-600 border-blue-600 text-white" : currentStep === "photo" ? "bg-green-600 border-green-600 text-white" : "bg-gray-200 border-gray-300"}`}
            >
              1
            </div>
            <span className="ml-2 text-sm font-medium">Payment</span>
          </div>
          <div
            className={`w-8 h-0.5 ${currentStep === "photo" || currentStep === "registration" ? "bg-green-600" : "bg-gray-300"}`}
          ></div>
          <div
            className={`flex items-center ${currentStep === "photo" ? "text-blue-600" : currentStep === "registration" ? "text-green-600" : "text-gray-400"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "photo" ? "bg-blue-600 border-blue-600 text-white" : currentStep === "registration" ? "bg-green-600 border-green-600 text-white" : "bg-gray-200 border-gray-300"}`}
            >
              2
            </div>
            <span className="ml-2 text-sm font-medium">Photo</span>
          </div>
          <div
            className={`w-8 h-0.5 ${currentStep === "registration" ? "bg-green-600" : "bg-gray-300"}`}
          ></div>
          <div
            className={`flex items-center ${currentStep === "registration" ? "text-blue-600" : "text-gray-400"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "registration" ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-200 border-gray-300"}`}
            >
              3
            </div>
            <span className="ml-2 text-sm font-medium">Registration</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === "payment" &&
        (!paymentData || !paymentData.payment_id ? (
          <PaymentVerification
            onVerified={(data) => {
              setPaymentData(data);
              setCurrentStep("photo");
            }}
            preFilledData={{
              email: paymentData?.email,
              phone: paymentData?.phone,
              firstName: paymentData?.firstName,
              lastName: paymentData?.lastName,
            }}
          />
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Payment verified! Proceeding to photo upload...
            </p>
            <button
              onClick={() => setCurrentStep("photo")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Continue to Photo Upload
            </button>
          </div>
        ))}

      {currentStep === "photo" && paymentData && (
        <PassportPhotoUpload
          email={paymentData.email}
          phone={paymentData.phone}
          onPhotoUploaded={(photoUrl) => {
            setPassportPhotoUrl(photoUrl);
          }}
          onBack={() => setCurrentStep("payment")}
          onContinue={() => setCurrentStep("registration")}
        />
      )}

      {currentStep === "registration" && paymentData && (
        <RegistrationForm
          paymentData={paymentData}
          passportPhotoUrl={passportPhotoUrl}
        />
      )}
    </div>
  );
}
