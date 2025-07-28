"use client";

import { useState, useRef } from "react";
import { Button } from "./button";
import { CardContainer } from "./card-container";
import { useToast } from "@/shared/hooks/useToast";

interface PassportPhotoUploadProps {
  onPhotoUploaded: (photoUrl: string) => void;
  onBack: () => void;
  onContinue: () => void;
  email: string;
  phone: string;
}

export function PassportPhotoUpload({
  onPhotoUploaded,
  onBack,
  onContinue,
  email,
  phone,
}: PassportPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a JPG, PNG, or WebP image",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("No file selected", {
        description: "Please select a passport photo to upload",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData for API upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email);
      formData.append("phone", phone);

      // Upload via API endpoint
      const response = await fetch("/api/upload/passport-photo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      const photoUrl = result.data.photoUrl;
      setUploadedPhotoUrl(photoUrl);
      onPhotoUploaded(photoUrl);

      toast.success("Photo uploaded successfully", {
        description: "Your passport photo has been uploaded",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed", {
        description:
          error.message || "Failed to upload photo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CardContainer title="Passport Photo Upload">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Photo Requirements
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Recent passport-style photo (head and shoulders)</li>
              <li>• Clear, well-lit image</li>
              <li>• File size: Maximum 5MB</li>
              <li>• Formats: JPG, PNG, or WebP</li>
            </ul>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Passport Photo *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Preview</h4>
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Passport photo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload Status */}
            {uploadedPhotoUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-2"
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
                  <span className="text-sm text-green-800">
                    Photo uploaded successfully
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Back
            </Button>

            {previewUrl && !uploadedPhotoUrl && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? "Uploading..." : "Upload Photo"}
              </Button>
            )}

            {uploadedPhotoUrl && (
              <Button onClick={onContinue} className="flex-1">
                Continue to Room Selection
              </Button>
            )}
          </div>
        </div>
      </CardContainer>
    </div>
  );
}
