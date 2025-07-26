"use client";

import DynamicForm from "@/shared/components/forms/DynamicForm";
import { PaymentSchema, PaymentFormData } from "@/shared/utils/validation";
import { PAYMENT_CONFIG } from "@/shared/config/constants";
import React from "react";

const page = () => {
  const handlePaymentSubmit = async (data: PaymentFormData) => {
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
      console.error("Payment error:", error);
      return {
        success: false,
        error: { message: "An error occurred during payment processing" },
      };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Make Payment</h1>
      <div className="max-w-md mx-auto">
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

export default page;
