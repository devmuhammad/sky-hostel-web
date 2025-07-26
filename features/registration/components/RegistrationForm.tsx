"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  RegistrationSchema,
  RegistrationFormData,
} from "@/shared/utils/validation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { FileUpload } from "@/shared/components/ui/file-upload";
import { useToast } from "@/shared/hooks/useToast";
import { uploadPassportPhoto } from "@/shared/utils/supabase-storage";
import RoomSelection from "./RoomSelection";

interface RegistrationFormProps {
  paymentData: any;
}

export default function RegistrationForm({
  paymentData,
}: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [roomSelection, setRoomSelection] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const router = useRouter();
  const toast = useToast();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(RegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: paymentData?.email || "",
      phoneNumber: paymentData?.phone || "",
      dateOfBirth: "",
      address: "",
      stateOfOrigin: "",
      lga: "",
      maritalStatus: "",
      religion: "",
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

    setIsSubmitting(true);
    let passportPhotoUrl = null;

    try {
      const formData = form.getValues();

      // Upload passport photo if provided
      if (passportFile) {
        setUploadingPhoto(true);
        toast.info("Uploading passport photo...", {
          description: "Please wait while we upload your photo",
        });

        try {
          // We'll use a temporary student ID for upload, then update after registration
          const tempId = `temp_${Date.now()}`;
          passportPhotoUrl = await uploadPassportPhoto(passportFile, tempId);

          toast.success("Photo uploaded successfully");
        } catch (error: any) {
          toast.error("Photo upload failed", {
            description:
              error.message || "Please try again or continue without photo",
          });
          // Continue without photo - don't block registration
        } finally {
          setUploadingPhoto(false);
        }
      }

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
        payment_id: paymentData.payment_id,
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
        toast.success("Registration completed successfully!", {
          description:
            "Welcome to Sky Student Hostel! Your confirmation details are ready.",
        });

        // Redirect to confirmation page with student ID
        setTimeout(() => {
          router.push(
            `/registration/success?student_id=${result.data.student_id}`
          );
        }, 1500);
      } else {
        toast.error("Registration failed", {
          description: result.error?.message || "Please try again",
        });
      }
    } catch (error: any) {
      toast.error("Registration failed", {
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
      setUploadingPhoto(false);
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            Final Step: Review & Submit
          </h2>
          <p className="text-gray-600">
            Please review your information and upload your passport photograph.
          </p>
        </div>

        <div className="space-y-8">
          {/* Registration Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Registration Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">
                  {form.getValues("firstName")} {form.getValues("lastName")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Matric Number:</span>
                <span className="ml-2 font-medium">
                  {form.getValues("matricNumber")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Faculty:</span>
                <span className="ml-2 font-medium">
                  {form.getValues("faculty")}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Level:</span>
                <span className="ml-2 font-medium">
                  {form.getValues("level")}
                </span>
              </div>
            </div>

            {roomSelection && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Accommodation Assignment</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{roomSelection.block}</span> -
                  <span className="font-medium"> {roomSelection.room}</span> -
                  <span className="font-medium"> {roomSelection.bedspace}</span>
                </p>
              </div>
            )}
          </div>

          {/* Passport Photo Upload */}
          <div>
            <h3 className="font-semibold mb-4">Passport Photograph</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please upload a recent passport photograph. This is optional but
              recommended for identification purposes.
            </p>

            <FileUpload
              onFileSelect={setPassportFile}
              disabled={uploadingPhoto || isSubmitting}
              maxSize={5} // 5MB limit
              className="max-w-md"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onPreviousStep}
              disabled={isSubmitting || uploadingPhoto}
            >
              Back to Room Selection
            </Button>

            <Button
              onClick={onFinalSubmit}
              disabled={isSubmitting || uploadingPhoto}
              className="min-w-[150px]"
            >
              {isSubmitting
                ? "Submitting..."
                : uploadingPhoto
                  ? "Uploading..."
                  : "Complete Registration"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Personal & Academic Information
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Student Registration</h2>
        <p className="text-gray-600">
          Please provide your personal and academic information.
        </p>
      </div>

      <form className="space-y-6">
        {/* Personal Information Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                className={
                  form.formState.errors.firstName ? "border-red-500" : ""
                }
              />
              {form.formState.errors.firstName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                className={
                  form.formState.errors.lastName ? "border-red-500" : ""
                }
              />
              {form.formState.errors.lastName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                {...form.register("phoneNumber")}
                className={
                  form.formState.errors.phoneNumber ? "border-red-500" : ""
                }
              />
              {form.formState.errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
                className={
                  form.formState.errors.dateOfBirth ? "border-red-500" : ""
                }
              />
              {form.formState.errors.dateOfBirth && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="stateOfOrigin">State of Origin *</Label>
              <Input
                id="stateOfOrigin"
                {...form.register("stateOfOrigin")}
                className={
                  form.formState.errors.stateOfOrigin ? "border-red-500" : ""
                }
              />
              {form.formState.errors.stateOfOrigin && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.stateOfOrigin.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Enter your full address"
              className={form.formState.errors.address ? "border-red-500" : ""}
            />
            {form.formState.errors.address && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor="lga">Local Government Area *</Label>
              <Input
                id="lga"
                {...form.register("lga")}
                className={form.formState.errors.lga ? "border-red-500" : ""}
              />
              {form.formState.errors.lga && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.lga.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="maritalStatus">Marital Status *</Label>
              <select
                id="maritalStatus"
                {...form.register("maritalStatus")}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  form.formState.errors.maritalStatus ? "border-red-500" : ""
                }`}
              >
                <option value="">Select status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
              {form.formState.errors.maritalStatus && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.maritalStatus.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="religion">Religion *</Label>
              <Input
                id="religion"
                {...form.register("religion")}
                className={
                  form.formState.errors.religion ? "border-red-500" : ""
                }
              />
              {form.formState.errors.religion && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.religion.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matricNumber">Matric Number *</Label>
              <Input
                id="matricNumber"
                {...form.register("matricNumber")}
                className={
                  form.formState.errors.matricNumber ? "border-red-500" : ""
                }
              />
              {form.formState.errors.matricNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.matricNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="course">Course *</Label>
              <Input
                id="course"
                {...form.register("course")}
                className={form.formState.errors.course ? "border-red-500" : ""}
              />
              {form.formState.errors.course && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.course.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="faculty">Faculty *</Label>
              <Input
                id="faculty"
                {...form.register("faculty")}
                className={
                  form.formState.errors.faculty ? "border-red-500" : ""
                }
              />
              {form.formState.errors.faculty && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.faculty.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                {...form.register("department")}
                className={
                  form.formState.errors.department ? "border-red-500" : ""
                }
              />
              {form.formState.errors.department && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.department.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="level">Level *</Label>
              <select
                id="level"
                {...form.register("level")}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  form.formState.errors.level ? "border-red-500" : ""
                }`}
              >
                <option value="">Select level</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
                <option value="600">600 Level</option>
              </select>
              {form.formState.errors.level && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.level.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Next of Kin Information Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Next of Kin Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nextOfKinName">Full Name *</Label>
              <Input
                id="nextOfKinName"
                {...form.register("nextOfKinName")}
                className={
                  form.formState.errors.nextOfKinName ? "border-red-500" : ""
                }
              />
              {form.formState.errors.nextOfKinName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.nextOfKinName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nextOfKinPhoneNumber">Phone Number *</Label>
              <Input
                id="nextOfKinPhoneNumber"
                type="tel"
                {...form.register("nextOfKinPhoneNumber")}
                className={
                  form.formState.errors.nextOfKinPhoneNumber
                    ? "border-red-500"
                    : ""
                }
              />
              {form.formState.errors.nextOfKinPhoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.nextOfKinPhoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nextOfKinEmail">Email Address *</Label>
              <Input
                id="nextOfKinEmail"
                type="email"
                {...form.register("nextOfKinEmail")}
                className={
                  form.formState.errors.nextOfKinEmail ? "border-red-500" : ""
                }
              />
              {form.formState.errors.nextOfKinEmail && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.nextOfKinEmail.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="nextOfKinRelationship">Relationship *</Label>
              <select
                id="nextOfKinRelationship"
                {...form.register("nextOfKinRelationship")}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  form.formState.errors.nextOfKinRelationship
                    ? "border-red-500"
                    : ""
                }`}
              >
                <option value="">Select relationship</option>
                <option value="Parent">Parent</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Spouse">Spouse</option>
                <option value="Relative">Relative</option>
                <option value="Friend">Friend</option>
              </select>
              {form.formState.errors.nextOfKinRelationship && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.nextOfKinRelationship.message}
                </p>
              )}
            </div>
          </div>
        </div>

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
