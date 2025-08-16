"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PAYMENT_CONFIG } from "@/shared/config/constants";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ErrorAlert } from "@/shared/components/ui/error-alert";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";

import { useApi } from "@/shared/hooks/useApi";
import { useToast } from "@/shared/hooks/useToast";

const VerificationSchema = z
  .object({
    email: z
      .string()
      .email("Please enter a valid email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .min(10, "Please enter a valid phone number")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.email || data.phone, {
    message: "Please provide either email or phone number",
    path: ["email"],
  });

type VerificationData = z.infer<typeof VerificationSchema>;

interface PaymentVerificationProps {
  onVerified: (data: any) => void;
  preFilledData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  };
}

function usePaymentVerification() {
  const { execute, isLoading, error } = useApi<any>("/api/payments/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return { execute, isLoading, error };
}

export default function PaymentVerification({
  onVerified,
  preFilledData,
}: PaymentVerificationProps) {
  const { error, execute, isLoading } = usePaymentVerification();
  const [partialPaymentInfo, setPartialPaymentInfo] = useState<any>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState<string | null>(
    null
  );
  const toast = useToast();

  const form = useForm<VerificationData>({
    resolver: zodResolver(VerificationSchema),
    defaultValues: {
      email: preFilledData?.email || "",
      phone: preFilledData?.phone || "",
    },
  });

  // Update form values when preFilledData changes
  useEffect(() => {
    if (preFilledData?.email) {
      form.setValue("email", preFilledData.email);
    }
  }, [preFilledData, form]);

  const onSubmit = async (data: VerificationData) => {
    const loadingToastId = toast.loading("Verifying payment...", {
      description: "Please wait while we check your payment status",
    });

    const result = await execute({
      body: JSON.stringify({
        email: data.email || undefined,
        phone: data.phone || undefined,
      }),
    });

    toast.dismiss(loadingToastId);

    if (result.success) {
      // Check if payment is fully paid
      if (result.data?.isFullyPaid) {
        toast.success("Payment verified successfully!", {
          description: "You can now proceed with your registration",
        });

        const verifiedData = {
          ...result.data,
          email: preFilledData?.email || data.email || "",
          phone: preFilledData?.phone || data.phone || "",
          firstName: preFilledData?.firstName || "",
          lastName: preFilledData?.lastName || "",
          payment_id: result.data?.payment_id,
        };

        // Pass along all the pre-filled data
        onVerified(verifiedData);
      } else {
        // Payment is not fully paid
        toast.error("Payment incomplete", {
          description: `You have paid ₦${result.data?.totalPaid?.toLocaleString() || 0} out of ₦${PAYMENT_CONFIG.amount.toLocaleString()}. Please complete your payment before registering.`,
        });

        setPartialPaymentInfo({
          totalPaid: result.data?.totalPaid || 0,
          remainingAmount:
            result.data?.remainingAmount || PAYMENT_CONFIG.amount,
          isFullyPaid: false,
          payments: result.data?.payments || [],
        });
      }
    } else if (
      result.error?.message &&
      result.error.message.includes("Payment incomplete")
    ) {
      toast.warning("Incomplete payment", {
        description: result.error.message,
      });
      // Handle partial payment case - show generic message for now
      setPartialPaymentInfo({
        totalPaid: PAYMENT_CONFIG.amount / 2, // Example amount (half paid)
        remainingAmount: PAYMENT_CONFIG.amount / 2, // Example remaining (half)
        isFullyPaid: false,
        payments: [],
      });
    } else if (
      result.error?.message &&
      result.error.message.includes("already registered")
    ) {
      toast.error("Already Registered", {
        description: result.error.message,
      });
      setAlreadyRegistered(result.error.message);
      return;
    } else {
      toast.error("Payment verification failed", {
        description:
          result.error?.message || "Please check your details and try again",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Payment Verification
        </h2>

        {alreadyRegistered ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Already Registered
            </h3>
            <p className="text-gray-600 mb-6">{alreadyRegistered}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                If you believe this is an error or need assistance, please
                contact support.
              </p>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Return to Home
              </Button>
            </div>
          </div>
        ) : (
          <>
            {preFilledData?.email || preFilledData?.phone ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  <strong>Payment Information Pre-filled:</strong> Your payment
                  details have been pre-filled. Please click &quot;Verify
                  Payment&quot; to confirm your payment status before proceeding
                  with registration.
                </p>
              </div>
            ) : null}

            {/* Help for users who haven't paid yet */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                Haven&apos;t made payment yet?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                You need to pay the accommodation fee of{" "}
                {PAYMENT_CONFIG.formatAmount()} before you can register.
              </p>
              <Button
                onClick={() => (window.location.href = "/invoice")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Make Payment Now
              </Button>
            </div>

            {partialPaymentInfo && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Partial Payment Detected
                </h3>
                <p className="text-sm text-yellow-700">
                  You have made a partial payment. Please complete your payment
                  of {PAYMENT_CONFIG.formatAmount()} to proceed with
                  registration.
                </p>
                <div className="mt-3">
                  <Button
                    onClick={() => (window.location.href = "/invoice")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Complete Payment
                  </Button>
                </div>
              </div>
            )}

            <ErrorAlert error={error} />
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          disabled={!!preFilledData?.email}
                          className={preFilledData?.email ? "bg-gray-100" : ""}
                        />
                      </FormControl>
                      {preFilledData?.email && (
                        <p className="text-sm text-blue-600">
                          Email pre-filled from payment - cannot be changed
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-center text-sm text-gray-500">OR</div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  className="w-full"
                >
                  Verify Payment
                </LoadingButton>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
