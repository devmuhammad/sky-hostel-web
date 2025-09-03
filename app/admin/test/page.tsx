"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

export default function AdminTest() {
  const [testResult, setTestResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const testPaymentVerification = async () => {
    setIsLoading(true);
    setTestResult("Testing payment verification...");

    try {
      // Test with a sample email
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResult(
          `✅ Payment verification working! Amount: ₦${result.data?.totalPaid?.toLocaleString() || 0}`
        );
      } else {
        setTestResult(
          `❌ Payment verification failed: ${result.error?.message || "Unknown error"}`
        );
      }
    } catch (error) {
      setTestResult(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Test Page</h1>
      <p>If you can see this, admin routes are working!</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          Payment Verification Test
        </h2>
        <Button
          onClick={testPaymentVerification}
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? "Testing..." : "Test Payment Verification"}
        </Button>

        {testResult && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <pre className="whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
