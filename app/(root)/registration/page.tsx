"use client";

import { useState, useEffect, Suspense } from "react";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";
import { useSearchParams } from "next/navigation";
import PaymentVerification from "@/features/registration/components/PaymentVerification";
import RegistrationForm from "@/features/registration/components/RegistrationForm";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

function RegistrationContent() {
  const [paymentData, setPaymentData] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const verified = searchParams.get("verified");

    // If coming from successful payment, skip verification
    if (verified === "true" && (email || phone)) {
      setPaymentData({
        email: email,
        phone: phone,
        totalPaid: PAYMENT_CONFIG.amount,
        isFullyPaid: true,
      });
    }
  }, [searchParams]);

  const handlePaymentVerified = (data: any) => {
    setPaymentData(data);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Student Registration
      </h1>

      {!paymentData ? (
        <PaymentVerification onVerified={handlePaymentVerified} />
      ) : (
        <RegistrationForm paymentData={paymentData} />
      )}
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            Student Registration
          </h1>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
