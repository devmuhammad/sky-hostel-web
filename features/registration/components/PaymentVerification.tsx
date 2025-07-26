"use client";

import { useState } from "react";
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
}: PaymentVerificationProps) {
  const { error, execute, isLoading } = usePaymentVerification();
  const [partialPaymentInfo, setPartialPaymentInfo] = useState<any>(null);
  const toast = useToast();

  const form = useForm<VerificationData>({
    resolver: zodResolver(VerificationSchema),
    defaultValues: {
      email: "",
      phone: "",
    },
  });

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
      toast.success("Payment verified successfully!", {
        description: "You can now proceed with your registration",
      });
      onVerified(result.data);
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
    } else {
      toast.error("Payment verification failed", {
        description:
          result.error?.message || "Please check your details and try again",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Verify Payment</h2>
      <p className="text-gray-600 mb-6">
        Please provide your email or phone number to verify your payment before
        proceeding with registration.
      </p>

      {/* Help for users who haven't paid yet */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">
          Haven&apos;t made payment yet?
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          You need to pay the accommodation fee of{" "}
          {PAYMENT_CONFIG.formatAmount()}
          before you can register.
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
            You have made a partial payment. Please complete your payment of{" "}
            {PAYMENT_CONFIG.formatAmount()} to proceed with registration.
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    {...field}
                  />
                </FormControl>
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
    </div>
  );
}
