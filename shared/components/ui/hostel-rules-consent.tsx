"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface HostelRulesConsentProps {
  onComplete: (data: {
    firstName: string;
    lastName: string;
    date: string;
    rulesAccepted: boolean;
  }) => void;
  onBack: () => void;
  showNavigation?: boolean;
  onFormChange?: (
    data: {
      firstName: string;
      lastName: string;
      date: string;
      rulesAccepted: boolean;
    } | null
  ) => void;
}

const HOSTEL_RULES = [
  {
    title: "1. Electrical Appliances & Energy Conservation",
    rules: [
      "No personal irons are allowed in the hostel. Solar irons will be provided for student use.",
      "Always conserve energy. Turn off lights, fans, and unplug sockets when not in use or when leaving your room.",
    ],
  },
  {
    title: "2. Waste Disposal & Recycling",
    rules: [
      "Sort your waste into the designated bins:",
      "• Category A (Recyclables): Cans, bottles, plastic plates.",
      "• Category B (Plastics/Nylons): Sachet water nylons, soap wrappers, food packaging bags/polythene.",
      "• Category C (Food Debris): Dispose of food waste in the appropriate bins. Do not force food debris down kitchen sinks to prevent blockages.",
      "Ensure all soap nylons (bar or liquid) and bags used to bring food from home are disposed of appropriately.",
    ],
  },
  {
    title: "3. Room & Bathroom Cleanliness",
    rules: [
      "Maintain a high standard of cleanliness in your room at all times.",
      "Rooms, bathrooms, and toilets must be thoroughly cleaned either bi-weekly or every three days. A schedule will be provided for this.",
      "Keep your room orderly. Do not place bags, shoes, or any other items under the lower bunk beds.",
      "You are required to come to the hostel equipped with: disinfectant, toilet wash and brush, room freshener, broom, and mop.",
    ],
  },
  {
    title: "4. Penalties",
    rules: [
      "Any room found violating these rules will be penalized by having the room locked for the day.",
    ],
  },
];

export function HostelRulesConsent({
  onComplete,
  onBack,
  showNavigation = true,
  onFormChange,
}: HostelRulesConsentProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [date, setDate] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);

  const handleSubmit = () => {
    if (firstName && lastName && date && rulesAccepted) {
      onComplete({
        firstName,
        lastName,
        date,
        rulesAccepted,
      });
    }
  };

  const canSubmit = firstName && lastName && date && rulesAccepted;

  // Notify parent component of form changes
  useEffect(() => {
    if (onFormChange) {
      onFormChange({
        firstName,
        lastName,
        date,
        rulesAccepted,
      });
    }
  }, [firstName, lastName, date, rulesAccepted, onFormChange]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Section Title */}
      <h2 className="text-2xl font-bold mb-6">
        Agreement, Rules and Regulations
      </h2>

      {/* Personal Declaration */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="firstName" className="mb-2">
              First Name *
            </Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="lastName" className="mb-2">
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          I <strong>{firstName || "[First Name]"}</strong>{" "}
          <strong>{lastName || "[Last Name]"}</strong> hereby declare that all
          the information given are TRUE and I undertake to abide by the
          following rules.
        </p>
      </div>

      {/* Rules List */}
      <div className="mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            To ensure a comfortable, safe, and clean living environment for all
            residents, please adhere to the following rules:
          </p>

          <div className="space-y-6">
            {HOSTEL_RULES.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-800 mb-2">
                  {section.title}
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.rules.map((rule, ruleIndex) => (
                    <li key={ruleIndex}>{rule}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-6">
            These rules are in place to foster a respectful and well-maintained
            living space for everyone. Your cooperation is greatly appreciated.
          </p>
        </div>
      </div>

      {/* Declaration and Penalties */}
      <div className="mb-8">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800 mb-3">
            I have read and fully understood the conditions stipulated above. I
            understand that failure to adhere strictly to the agreement will
            attract the following penalties:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>Outright ejection from the hostel without refund.</li>
            <li>
              Involvement of law enforcement agents if the agreement is
              violated.
            </li>
            <li>
              Deduction or full utilization of caution fee for any damage to
              hostel property caused by the applicant.
            </li>
          </ul>
        </div>
      </div>

      {/* Signature Declaration */}
      <div className="mb-6">
        <Label className="text-base font-medium">Signature Declaration *</Label>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="rulesAccepted"
            checked={rulesAccepted}
            onChange={(e) => setRulesAccepted(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="rulesAccepted" className="ml-3 text-sm text-gray-700">
            I hereby sign and declare that all the above information is accurate
            and I would be held responsible for any inaccuracies and breach of
            any of the rules listed.
          </label>
        </div>
      </div>

      {/* Date Field */}
      <div className="mb-8">
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Submit Registration
          </Button>
        </div>
      )}
    </div>
  );
}
