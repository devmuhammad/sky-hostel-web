"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PaymentVerification from "@/features/registration/components/PaymentVerification";
import RegistrationForm from "@/features/registration/components/RegistrationForm";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function RegistrationPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const searchParams = useSearchParams();

  // Ensure component is mounted before accessing search params
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const verified = searchParams.get("verified");

    if (verified === "true" && (email || phone)) {
      setPaymentData({
        email: email,
        phone: phone,
        totalPaid: PAYMENT_CONFIG.amount,
        isFullyPaid: true,
      });
    }
  }, [mounted, searchParams]);

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Student Registration
      </h1>
      {!paymentData ? (
        <PaymentVerification onVerified={setPaymentData} />
      ) : (
        <RegistrationForm paymentData={paymentData} />
      )}
    </div>
  );
}
