"use client";

import { useState } from "react";
import {
  RoomSelectionWizard,
  HostelRulesConsent,
} from "@/shared/components/ui";

interface RoomSelection {
  block: string;
  room: string;
  bedspace: string;
  roomId: string;
}

interface RulesConsent {
  firstName: string;
  lastName: string;
  date: string;
  rulesAccepted: boolean;
}

export default function RoomSelectionDemo() {
  const [currentStep, setCurrentStep] = useState<
    "room-selection" | "rules-consent" | "registration-complete"
  >("room-selection");
  const [roomSelection, setRoomSelection] = useState<RoomSelection | null>(
    null
  );
  const [rulesConsent, setRulesConsent] = useState<RulesConsent | null>(null);

  const handleRoomSelectionComplete = (selection: RoomSelection) => {
    setRoomSelection(selection);
    setCurrentStep("rules-consent");
  };

  const handleRulesConsentComplete = (consent: RulesConsent) => {
    setRulesConsent(consent);
    setCurrentStep("registration-complete");
  };

  const handleBackToRoomSelection = () => {
    setCurrentStep("room-selection");
  };

  const handleBackToRulesConsent = () => {
    setCurrentStep("rules-consent");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Room Selection & Rules Demo
          </h1>
          <p className="text-gray-600">
            This demonstrates the new room selection wizard and hostel rules
            consent flow
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {currentStep === "room-selection" && (
            <RoomSelectionWizard
              onComplete={handleRoomSelectionComplete}
              onBack={() => window.history.back()}
            />
          )}

          {currentStep === "rules-consent" && (
            <HostelRulesConsent
              onComplete={handleRulesConsentComplete}
              onBack={handleBackToRoomSelection}
            />
          )}

          {currentStep === "registration-complete" && (
            <div className="max-w-4xl mx-auto p-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  Registration Complete!
                </h2>
                <p className="text-gray-600">
                  Your room selection and rules agreement have been completed
                  successfully
                </p>
              </div>

              {/* Room Selection Summary */}
              {roomSelection && (
                <div className="bg-blue-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-blue-800 mb-4">
                    Room Selection
                  </h3>
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
              )}

              {/* Rules Consent Summary */}
              {rulesConsent && (
                <div className="bg-green-50 p-6 rounded-lg mb-6">
                  <h3 className="font-semibold text-green-800 mb-4">
                    Rules Agreement
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>
                      <p className="text-green-700">
                        {rulesConsent.firstName} {rulesConsent.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>
                      <p className="text-green-700">{rulesConsent.date}</p>
                    </div>
                    <div>
                      <span className="font-medium">Rules Accepted:</span>
                      <p className="text-green-700">✓ Yes</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              <div className="bg-green-50 p-6 rounded-lg mb-8">
                <h3 className="font-semibold text-green-800 mb-4">
                  Next Steps
                </h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900 mb-2">
                    ✅ All Set!
                  </div>
                  <p className="text-green-700">
                    You can now proceed to complete your registration with the
                    selected room and bedspace.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={handleBackToRulesConsent}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Rules
                </button>
                <button
                  onClick={() => (window.location.href = "/registration")}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Demo Info */}
        <div className="max-w-2xl mx-auto mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Demo Information
          </h3>
          <p className="text-sm text-yellow-700 mb-3">
            This is a demonstration of the new room selection and rules consent
            flow. The components are fully functional and ready to be integrated
            into the main application.
          </p>
          <div className="text-sm text-yellow-700 space-y-1">
            <p>
              <strong>✅ Fixed:</strong> Bedspace selection now works properly
              with database mapping
            </p>
            <p>
              <strong>✅ Integrated:</strong> Replaced old dropdown room
              selection with new wizard
            </p>
            <p>
              <strong>✅ Simplified:</strong> Removed progress bar for cleaner
              UI
            </p>
            <p>
              <strong>✅ API Ready:</strong> Compatible with existing
              registration API
            </p>
            <p>
              <strong>✅ Production Ready:</strong> Ready to use in main
              registration flow
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
