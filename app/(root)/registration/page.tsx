"use client";

import { useState, useEffect } from "react";
import PaymentVerification from "@/features/registration/components/PaymentVerification";
import RegistrationForm from "@/features/registration/components/RegistrationForm";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function RegistrationPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Ensure component is mounted before accessing search params
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Only use URLSearchParams after mounting
    const searchParams = new URLSearchParams(window.location.search);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const verified = searchParams.get("verified");
    const ref = searchParams.get("ref");

    if (verified === "true" && (email || phone)) {
      setPaymentData({
        email: email,
        phone: phone,
        reference: ref,
        totalPaid: PAYMENT_CONFIG.amount,
        isFullyPaid: true,
      });
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
        Student Registration
      </h1>

      {/* Show success message when coming from payment */}
      {paymentData && (
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
                Payment Successful!
              </h3>
              <p className="text-green-700 text-sm">
                Complete your registration below
              </p>
            </div>
          </div>
        </div>
      )}

      {!paymentData ? (
        <PaymentVerification onVerified={setPaymentData} />
      ) : (
        <RegistrationForm paymentData={paymentData} />
      )}
    </div>
  );
}
