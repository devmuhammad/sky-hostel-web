"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";

import { ActionResponse } from "@/shared/types/global";

import {
  getFieldLabel,
  getInputType,
  getInputProps,
} from "@/shared/utils/validation";
import { useToast } from "@/shared/hooks/useToast";

interface DynamicFormProps {
  schema: any;
  defaultValues: Record<string, any>;
  onSubmit: (data: any) => Promise<ActionResponse>;
  formType?: "INVOICE" | "PAYMENT" | "REGISTRATION";
}

const DynamicForm = ({
  schema,
  defaultValues,
  onSubmit,
  formType,
}: DynamicFormProps) => {
  const router = useRouter();
  const toast = useToast();

  // @ts-ignore - Version compatibility issue between zod and @hookform/resolvers
  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues,
  });

  const handleSubmit = async (data: any) => {
    const loadingToastId = toast.loading(getLoadingText());

    try {
      const result = (await onSubmit(data)) as ActionResponse;

      // Always dismiss loading toast first
      toast.dismiss(loadingToastId);

      if (result?.success) {
        const successMessage =
          formType === "INVOICE" || formType === "PAYMENT"
            ? "Payment processed successfully"
            : "Registration successful";

        toast.success(successMessage, {
          description:
            formType === "INVOICE" || formType === "PAYMENT"
              ? "You will be redirected to complete your payment"
              : "Your registration has been completed successfully",
        });

        // Don't auto-redirect for payment forms since they handle their own redirects
        if (formType !== "PAYMENT" && formType !== "INVOICE") {
          setTimeout(() => {
            router.push("/");
          }, 1500);
        }
      } else {
        toast.error("Operation failed", {
          description: result?.error?.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
      // Always dismiss loading toast on error too
      toast.dismiss(loadingToastId);
      toast.error("Operation failed", {
        description:
          "An unexpected error occurred while processing your request",
      });
    }
  };

  const getButtonText = () => {
    if (formType === "INVOICE") return "Get an Invoice";
    if (formType === "PAYMENT") return "Proceed to Payment";
    return "Submit Registration";
  };

  const getLoadingText = () => {
    if (formType === "INVOICE") return "Generating invoice...";
    if (formType === "PAYMENT") return "Processing payment...";
    return "Submitting registration...";
  };

  // Get form fields from schema
  const schemaShape = (schema as any)._def?.shape || {};
  const formFields = Object.keys(schemaShape);

  return (
    <div className="w-full max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {formFields.map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control as any}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getFieldLabel(fieldName)}</FormLabel>
                  <FormControl>
                    <Input
                      type={getInputType(fieldName)}
                      placeholder={`Enter your ${getFieldLabel(fieldName).toLowerCase()}`}
                      {...field}
                      {...getInputProps(fieldName, field)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          {/* <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? getLoadingText() : getButtonText()}
          </Button> */}

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Back to Home
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DynamicForm;
