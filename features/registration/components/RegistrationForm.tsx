"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  RegistrationSchema,
  RegistrationFormData,
  getFieldLabel,
  getInputType,
} from "@/shared/utils/validation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import RoomSelection from "./RoomSelection";
import { HostelRulesConsent } from "@/shared/components/ui/hostel-rules-consent";
import { FIELD_CONFIG, SECTION_CONFIG } from "@/shared/constants";
import { toast } from "sonner";
interface RegistrationFormProps {
  paymentData: any;
  passportPhotoUrl?: string | null;
}

export default function RegistrationForm({
  paymentData,
  passportPhotoUrl,
}: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [roomSelection, setRoomSelection] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rulesFormData, setRulesFormData] = useState<{
    firstName: string;
    lastName: string;
    date: string;
    rulesAccepted: boolean;
  } | null>(null);

  const router = useRouter();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      firstName: paymentData?.firstName || "",
      lastName: paymentData?.lastName || "",
      email: paymentData?.email || "",
      phoneNumber: paymentData?.phone || "",
      dateOfBirth: "",
      address: "",
      stateOfOrigin: "",
      lga: "",
      maritalStatus: "",
      religion: "",
      weight: 55,
      matricNumber: "",
      course: "",
      level: "",
      faculty: "",
      department: "",
      nextOfKinName: "",
      nextOfKinPhoneNumber: "",
      nextOfKinEmail: "",
      nextOfKinRelationship: "",
    },
  });

  const onNextStep = () => {
    setCurrentStep(2);
  };

  const onPreviousStep = () => {
    setCurrentStep(1);
  };

  const onRoomSelected = (selection: any) => {
    setRoomSelection(selection);
    setCurrentStep(3); // Move to final step
  };

  const onFinalSubmit = async () => {
    if (!roomSelection) return;

    if (!rulesFormData || !rulesFormData.rulesAccepted) {
      toast.error("Please complete the rules and regulations consent", {
        description:
          "You must read and agree to the hostel rules before completing registration",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = form.getValues();

      const registrationData = {
        // Personal Information
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        date_of_birth: formData.dateOfBirth,
        address: formData.address,
        state_of_origin: formData.stateOfOrigin,
        lga: formData.lga,
        marital_status: formData.maritalStatus,
        religion: formData.religion,
        weight: formData.weight,

        // Academic Information
        matric_number: formData.matricNumber,
        course: formData.course,
        level: formData.level,
        faculty: formData.faculty,
        department: formData.department,

        // Next of Kin Information
        next_of_kin_name: formData.nextOfKinName,
        next_of_kin_phone: formData.nextOfKinPhoneNumber,
        next_of_kin_email: formData.nextOfKinEmail,
        next_of_kin_relationship: formData.nextOfKinRelationship,

        // Accommodation
        block: roomSelection.block,
        room: roomSelection.room,
        bedspace_label: roomSelection.bedspace,

        // System Information
        payment_id: paymentData.payment_id || null,
        room_id: roomSelection.roomId,

        // Passport Photo
        passport_photo_url: passportPhotoUrl,
      };

      const loadingToastId = toast.loading("Completing registration...", {
        description: "Assigning your bedspace and finalizing registration",
      });

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();
      toast.dismiss(loadingToastId);

      if (result.success) {
        // Send confirmation email
        try {
          const emailData = {
            studentName: `${formData.firstName} ${formData.lastName}`,
            matricNumber: formData.matricNumber,
            email: formData.email,
            phone: formData.phoneNumber,
            course: formData.course,
            level: formData.level,
            faculty: formData.faculty,
            department: formData.department,
            roomNumber: roomSelection.room,
            bedspace: roomSelection.bedspace,
            block: roomSelection.block,
            amountPaid: paymentData?.totalPaid || 0,
            amountToPay: 219000, // Fixed amount for hostel fee
            registrationDate: new Date().toISOString(),
            passportPhotoUrl: passportPhotoUrl,
          };

          const emailResponse = await fetch(
            "/api/email/send-registration-confirmation",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(emailData),
            }
          );

          const emailResult = await emailResponse.json();

          if (emailResponse.ok) {
            toast.success("Registration completed successfully!", {
              description:
                "Welcome to Sky Student Hostel! Confirmation email sent to your inbox.",
            });
          } else {
            toast.success("Registration completed successfully!", {
              description:
                "Welcome to Sky Student Hostel! Your confirmation details are ready.",
            });
          }
        } catch (emailError) {
          toast.success("Registration completed successfully!", {
            description:
              "Welcome to Sky Student Hostel! Your confirmation details are ready.",
          });
        }

        // Redirect to confirmation page with student ID
        setTimeout(() => {
          router.push(
            `/registration/success?student_id=${result.data.student_id}`
          );
        }, 1500);
      } else {
        // Handle specific bedspace errors
        if (
          result.error?.message?.includes("Bedspace") ||
          response.status === 409
        ) {
          toast.error("Bedspace no longer available", {
            description:
              "The bedspace you selected was just taken by another user. Please go back and select a different bedspace.",
          });
          // Go back to room selection step
          setCurrentStep(2);
        } else {
          toast.error("Registration failed", {
            description: result.error?.message || "Please try again",
          });
        }
      }
    } catch (error: any) {
      toast.error("Registration failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a single form field
  const renderField = (fieldName: keyof RegistrationFormData) => {
    const config = FIELD_CONFIG[fieldName];
    if (!config) return null;

    const isDisabled =
      config.canBeDisabled &&
      ((fieldName === "email" && paymentData?.email) ||
        (fieldName === "phoneNumber" && paymentData?.phone));

    const isPreFilled =
      config.canBePreFilled &&
      ((fieldName === "firstName" && paymentData?.firstName) ||
        (fieldName === "lastName" && paymentData?.lastName));

    const error = form.formState.errors[fieldName];
    const isError = !!error;

    return (
      <div key={fieldName} className={config.fullWidth ? "md:col-span-2" : ""}>
        <Label htmlFor={fieldName} className="mb-2">
          {getFieldLabel(fieldName)} *
          {isPreFilled && (
            <span className="ml-2 text-sm text-blue-600 font-normal">
              (Pre-filled from payment)
            </span>
          )}
        </Label>

        {config.type === "select" ? (
          <select
            id={fieldName}
            {...form.register(fieldName)}
            disabled={isDisabled}
            className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              isError ? "border-red-500" : ""
            } ${isDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          >
            {config.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <Input
            id={fieldName}
            type={getInputType(fieldName)}
            {...form.register(fieldName)}
            disabled={isDisabled}
            className={`${isError ? "border-red-500" : ""} ${
              isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        )}

        {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}

        {isPreFilled && (
          <p className="text-blue-600 text-sm mt-1">
            ✓ {fieldName === "firstName" ? "First name" : "Last name"}{" "}
            pre-filled from payment. You can edit if needed.
          </p>
        )}
      </div>
    );
  };

  // Render a section of fields
  const renderSection = (sectionKey: string) => {
    const sectionConfig =
      SECTION_CONFIG[sectionKey as keyof typeof SECTION_CONFIG];
    const sectionFields = Object.keys(FIELD_CONFIG).filter(
      (fieldName) =>
        FIELD_CONFIG[fieldName as keyof RegistrationFormData].section ===
        sectionKey
    );

    return (
      <div key={sectionKey}>
        <h3 className="text-lg font-semibold mb-4">{sectionConfig.title}</h3>
        <div className={`grid ${sectionConfig.gridCols} gap-4`}>
          {sectionFields.map((fieldName) =>
            renderField(fieldName as keyof RegistrationFormData)
          )}
        </div>
      </div>
    );
  };

  if (currentStep === 2) {
    return (
      <RoomSelection
        onRoomSelected={onRoomSelected}
        onBack={onPreviousStep}
        studentData={form.getValues()}
      />
    );
  }

  if (currentStep === 3) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-4">Room Selection</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Block:</span>
              <p className="text-blue-700">{roomSelection.block}</p>
            </div>
            <div>
              <span className="font-medium">Room Number:</span>
              <p className="text-blue-700">{roomSelection.room}</p>
            </div>
            <div>
              <span className="font-medium">Bedspace:</span>
              <p className="text-blue-700">{roomSelection.bedspace}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-4">
            Registration Summary
          </h3>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong> {form.getValues().firstName}{" "}
              {form.getValues().lastName}
            </p>
            <p>
              <strong>Email:</strong> {form.getValues().email}
            </p>
            <p>
              <strong>Phone:</strong> {form.getValues().phoneNumber}
            </p>
            <p>
              <strong>Matric Number:</strong> {form.getValues().matricNumber}
            </p>
          </div>
        </div>

        {/* Hostel Rules Consent Section */}
        <div className="mb-6">
          <HostelRulesConsent
            onComplete={(data) => {
              setRulesFormData(data);
            }}
            onBack={() => setCurrentStep(1)}
            showNavigation={false}
            onFormChange={setRulesFormData}
          />
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            onClick={onPreviousStep}
            variant="outline"
            className="min-w-[150px]"
          >
            Back to Room Selection
          </Button>
          <Button
            type="button"
            onClick={onFinalSubmit}
            disabled={
              isSubmitting ||
              !rulesFormData?.rulesAccepted ||
              !rulesFormData?.firstName ||
              !rulesFormData?.lastName ||
              !rulesFormData?.date
            }
            className="min-w-[150px]"
          >
            {isSubmitting ? "Completing..." : "Complete Registration"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <form className="space-y-6">
        {/* Render all sections dynamically */}
        {Object.keys(SECTION_CONFIG).map((sectionKey) =>
          renderSection(sectionKey)
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="button"
            onClick={form.handleSubmit(onNextStep)}
            className="min-w-[150px]"
          >
            Next: Select Room
          </Button>
        </div>
      </form>
    </div>
  );
}
