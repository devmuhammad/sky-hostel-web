"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default function ConfirmPaymentPage() {
  const [mounted, setMounted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "success" | "pending" | "failed"
  >("loading");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [showManualCheck, setShowManualCheck] = useState(false);
  const [checkForm, setCheckForm] = useState({
    email: "",
    phone: "",
  });
  const [isChecking, setIsChecking] = useState(false);

  // Ensure component is mounted before accessing search params
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Only import and use useSearchParams after mounting
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get("ref");
    const status = searchParams.get("status");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    // Debug logging
    console.log("=== CONFIRM PAYMENT PAGE LOADED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Reference:", reference);
    console.log("Status:", status);
    console.log("Email:", email);
    console.log("Phone:", phone);
    console.log("Full URL:", window.location.href);

    if (status === "success") {
      setPaymentStatus("success");
      setPaymentDetails({ reference, email, phone });
    } else if (status === "cancelled" || status === "failed") {
      setPaymentStatus("failed");
    } else if (reference) {
      // Payment initiated but status unknown - show pending
      setPaymentStatus("pending");
      setPaymentDetails({ reference, email, phone });
    } else {
      setPaymentStatus("failed");
    }
  }, [mounted]);

  const handleManualCheck = async () => {
    if (!checkForm.email && !checkForm.phone) {
      alert("Please enter either email or phone number");
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkForm),
      });

      const result = await response.json();

      if (result.success && result.payment) {
        setPaymentDetails(result.payment);
        setPaymentStatus(
          result.payment.status === "completed"
            ? "success"
            : result.payment.status === "failed"
              ? "failed"
              : "pending"
        );
        setShowManualCheck(false);
      } else {
        alert(result.message || "Payment not found");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      alert("Error checking payment status");
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading state until mounted
  if (!mounted || paymentStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <div className="max-w-md w-full">
        {paymentStatus === "success" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully. You can now proceed
              with your registration.
            </p>
            {paymentDetails?.reference && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Payment Reference:</p>
                <p className="font-mono text-sm font-semibold">
                  {paymentDetails.reference}
                </p>
                <p className="text-sm text-gray-600 mt-2">Amount:</p>
                <p className="font-semibold">
                  ₦{paymentDetails.amount_paid?.toLocaleString()}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Link
                href={`/registration?email=${encodeURIComponent(paymentDetails?.email || "")}&phone=${encodeURIComponent(paymentDetails?.phone || "")}&verified=true`}
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Proceed to Registration
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Processing
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment is being processed. This may take a few minutes to
              complete.
            </p>
            {paymentDetails?.reference && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600">Payment Reference:</p>
                <p className="font-mono text-sm font-semibold">
                  {paymentDetails.reference}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                You will receive a confirmation once your payment is completed.
              </p>
              <Button
                onClick={() => setShowManualCheck(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Check Payment Status
              </Button>
              <Link
                href={`/registration?email=${encodeURIComponent(paymentDetails?.email || "")}&phone=${encodeURIComponent(paymentDetails?.phone || "")}&verified=true`}
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Check Registration Status
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h1>
            <p className="text-gray-600 mb-6">
              Unfortunately, your payment could not be processed. Please try
              again or contact support if the issue persists.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setShowManualCheck(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Check Payment Status
              </Button>
              <Link href="/invoice">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Try Payment Again
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Manual Payment Check Modal */}
        {showManualCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Check Payment Status
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your email or phone number to check your payment status.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={checkForm.email}
                    onChange={(e) =>
                      setCheckForm({ ...checkForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="text-center text-gray-500">OR</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={checkForm.phone}
                    onChange={(e) =>
                      setCheckForm({ ...checkForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="08123456789"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowManualCheck(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isChecking ? "Checking..." : "Check Status"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
