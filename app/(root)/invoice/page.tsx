"use client";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

import DynamicForm from "@/shared/components/forms/DynamicForm";
import { PaymentSchema, PaymentFormData } from "@/shared/utils/validation";
import { PAYMENT_CONFIG } from "@/shared/config/constants";
import { productionLogger } from "@/shared/utils/production-logger";
import { ConsentCheckboxes } from "@/shared/components/ui/consent-checkboxes";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [hostelSpaceAvailable, setHostelSpaceAvailable] = useState<
    boolean | null
  >(null);
  const [isCheckingSpace, setIsCheckingSpace] = useState(false);

  // Log environment on invoice page load (development only)
  useEffect(() => {
    productionLogger.log("=== INVOICE PAGE ENVIRONMENT CHECK ===");
    productionLogger.log(
      "NEXT_PUBLIC_APP_URL:",
      process.env.NEXT_PUBLIC_APP_URL
    );
    productionLogger.log("Payment amount:", PAYMENT_CONFIG.amount);
  }, []);

  // Check hostel space availability
  useEffect(() => {
    const checkHostelSpace = async () => {
      setIsCheckingSpace(true);
      try {
        const response = await fetch("/api/rooms");
        const result = await response.json();

        if (result.success) {
          const availableRooms = result.data || [];
          const totalAvailableBeds = availableRooms.reduce(
            (total: number, room: any) => {
              return total + (room.available_beds?.length || 0);
            },
            0
          );

          setHostelSpaceAvailable(totalAvailableBeds > 0);
        } else {
          setHostelSpaceAvailable(false);
        }
      } catch (error) {
        productionLogger.error("Error checking hostel space:", error);
        setHostelSpaceAvailable(false);
      } finally {
        setIsCheckingSpace(false);
      }
    };

    checkHostelSpace();
  }, []);
  const handlePaymentSubmit = async (data: PaymentFormData) => {
    // Check if all required consents are checked
    const requiredConsents = [
      "registration_incomplete",
      "installment_limit",
      "individual_payment",
    ];
    const allConsentsChecked = requiredConsents.every(
      (consent) => consents[consent]
    );

    if (!allConsentsChecked) {
      return {
        success: false,
        error: { message: "Please check all required terms and conditions" },
      };
    }

    // Check if hostel space is available
    if (hostelSpaceAvailable === false) {
      return {
        success: false,
        error: {
          message:
            "Sorry, no hostel space is currently available. Please try again later.",
        },
      };
    }

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to Paycashless invoice payment page
        window.location.href = result.data.payment_url;
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: {
            message: result.error?.message || "Payment creation failed",
          },
        };
      }
    } catch (error) {
      productionLogger.error("Payment error:", error);
      return {
        success: false,
        error: { message: "An error occurred during payment processing" },
      };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold text-center mb-8">
        SKY Hostel Application 2025/2026 Payment
      </h1>
      <div className="max-w-md mx-auto">
        {/* Hostel Space Availability Check */}
        {isCheckingSpace && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-yellow-800">
                Checking hostel availability...
              </span>
            </div>
          </div>
        )}

        {hostelSpaceAvailable === false && !isCheckingSpace && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-800 font-medium">
                No hostel space available
              </span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              All rooms are currently occupied. Please try again later.
            </p>
          </div>
        )}

        {/* Display fixed amount */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Payment Amount
          </h3>
          <p className="text-2xl font-bold text-blue-900">
            {PAYMENT_CONFIG.formatAmount()}
          </p>
          <p className="text-sm text-blue-600 mt-1">Annual accommodation fee</p>
          <p className="text-xs text-blue-500 mt-2">
            ✓ Partial payments accepted
          </p>
        </div>

        {/* Consent Checkboxes */}
        <ConsentCheckboxes
          items={[
            {
              id: "registration_incomplete",
              text: "Registration is not complete after payment, kindly ensure to return and reserve your room once payment is complete.",
              required: true,
            },
            {
              id: "installment_limit",
              text: "Please Note that you can only make a maximum of 2 installment payments.",
              required: true,
            },
            {
              id: "individual_payment",
              text: "You must pay individually for multiple students.",
              required: true,
            },
          ]}
          onConsentChange={setConsents}
          className="mb-6"
        />

        <DynamicForm
          formType="PAYMENT"
          schema={PaymentSchema}
          defaultValues={{
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          }}
          onSubmit={handlePaymentSubmit}
        />
      </div>
    </div>
  );
};

export default Page;
