"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export default function CheckPaymentPage() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    reference: "",
  });
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email && !formData.phone && !formData.reference) {
      setError("Please enter at least one field (email, phone, or reference)");
      return;
    }

    setIsChecking(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/payments/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Payment not found");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
      setError("Error checking payment status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <svg
            className="w-5 h-5"
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
        );
      case "pending":
        return (
          <svg
            className="w-5 h-5"
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
        );
      case "failed":
        return (
          <svg
            className="w-5 h-5"
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
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check Payment Status
            </h1>
            <p className="text-gray-600">
              Enter your details to check if your payment has been processed
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="08123456789"
              />
            </div>

            <div className="text-center text-gray-500 text-sm">OR</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SKY-1234567890-abc123"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isChecking ? "Checking..." : "Check Payment Status"}
            </Button>
          </form>

          {result && (
            <div className="mt-8 space-y-4">
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Details
                </h3>

                <div
                  className={`rounded-lg border p-4 ${getStatusColor(result.payment.status)}`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(result.payment.status)}
                    <span className="font-semibold capitalize">
                      {result.payment.status}
                    </span>
                  </div>
                  <p className="text-sm">{result.payment.statusMessage}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-semibold">
                      ₦{result.payment.amount_paid?.toLocaleString()} of ₦
                      {result.payment.amount_to_pay?.toLocaleString() ||
                        "219,000"}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Reference</p>
                    <p className="font-mono text-sm">
                      {result.payment.reference}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">Date Created</p>
                    <p className="text-sm">
                      {new Date(result.payment.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {result.payment.paid_at && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">Date Paid</p>
                      <p className="text-sm">
                        {new Date(result.payment.paid_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {result.payment.status === "completed" && (
                  <div className="mt-6">
                    <Link href="/sold-out">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Proceed to Registration
                      </Button>
                    </Link>
                  </div>
                )}

                {result.payment.status === "pending" && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Next Steps:</strong> Your payment is being
                      processed. If you&apos;ve already made the payment, it may
                      take a few minutes to reflect. Please check back later.
                    </p>
                  </div>
                )}

                {result.payment.status === "failed" && (
                  <div className="mt-6">
                    <Link href="/invoice">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Try Payment Again
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Need to make a new payment?
              </p>
              <Link href="/sold-out">
                <Button variant="outline" className="w-full">
                  Make New Payment
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
