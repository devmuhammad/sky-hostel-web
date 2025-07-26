"use client";

import { useForm, FieldValues, DefaultValues, Path } from "react-hook-form";
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

interface DynamicFormProps<T extends Record<string, any>> {
  schema: z.ZodSchema<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<ActionResponse>;
  formType?: "INVOICE" | "PAYMENT" | "REGISTRATION";
}

const DynamicForm = <T extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  formType,
}: DynamicFormProps<T>) => {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: T) => {
    const loadingToastId = toast.loading(getLoadingText());

    try {
      const result = (await onSubmit(data)) as ActionResponse;

      if (result?.success) {
        toast.dismiss(loadingToastId);

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
        toast.dismiss(loadingToastId);
        toast.error("Operation failed", {
          description: result?.error?.message || "An unexpected error occurred",
        });
      }
    } catch (error) {
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
    if (formType === "INVOICE") return "Getting invoice...";
    if (formType === "PAYMENT") return "Processing payment...";
    return "Assigning bedspace...";
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="mt-10 space-y-6"
      >
        {Object.keys(defaultValues).map((fieldName) => (
          <FormField
            key={fieldName}
            control={form.control}
            name={fieldName as Path<T>}
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-2.5">
                <FormLabel className="paragraph-medium text-primary-500">
                  {getFieldLabel(fieldName)}
                </FormLabel>
                <FormControl>
                  <Input
                    type={getInputType(fieldName)}
                    {...getInputProps(fieldName, field)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          disabled={form.formState.isSubmitting}
          className="primary-gradient paragraph-medium min-h-12 w-full rounded-2 px-4 py-3 font-inter !text-light-900"
        >
          {form.formState.isSubmitting ? getLoadingText() : getButtonText()}
        </Button>

        {formType === "INVOICE" || formType === "PAYMENT" ? (
          <p className="">
            Already made a payment?{" "}
            <Link
              href="/confirm-payment"
              className="paragraph-semibold primary-text-gradient"
            >
              Confirm Payment
            </Link>
          </p>
        ) : (
          ""
        )}
      </form>
    </Form>
  );
};

export default DynamicForm;
