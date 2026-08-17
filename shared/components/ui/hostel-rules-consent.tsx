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
    title: "3. Admission & Discipline (2026/2027)",
    rules: [
      "A blacklist of students with records of dirtiness and rudeness has been sent to the DSA. Such students will NOT be readmitted.",
      "Zero tolerance: any student caught violating major rules will be issued 2 warnings. On the 3rd offense = Eviction.",
    ],
  },
  {
    title: "4. Mandatory Items at Resumption",
    rules: [
      "Entry will not be granted without: 1 bottle of insecticide (replenish every 4 months); 2 bedsheets, 2 bedcovers + 2 pillow cases; mop, broom, dustbin, iron sponges, toilet wash, scrub brushes, and a kitchen sink sieve; airtight food containers.",
      "If you do not have any item, it will be available for purchase at the hostel gate.",
    ],
  },
  {
    title: "5. Food Storage (No Sacks, Bags, or Nylons)",
    rules: [
      "All food items MUST be kept strictly in airtight containers. Sacks, cellophane bags, or open nylon bags of foodstuff are strictly prohibited.",
      "Bread, biscuits, garri, rice, beans, and all provisions must be transferred into an airtight container immediately after purchase.",
      "No cooked food, food wrappers, or dirty plates should be left in the room overnight. Wash plates immediately after eating.",
      "Rooms found with improper food packaging during inspection will be served a heavy penalty and fine.",
    ],
  },
  {
    title: "6. Room & Hostel Hygiene",
    rules: [
      "Keeping your room, bed area, and personal space clean daily is your sole responsibility.",
      "Do NOT remove your bed from the bunks to the floor. Anyone found doing this will be penalized.",
      "Every week, students are responsible for washing the Kitchen, Bathroom, Toilet, and WC in their wing/room.",
      "Rooms found dirty during weekly inspection will be fined. Beddings must be washed at least every 3 days.",
      "Optional: professional hostel cleaners may be hired if you need extra support.",
    ],
  },
  {
    title: "7. Pest Control & Sanitation",
    rules: [
      "Clean up immediately after cooking — wipe gas burner, kitchen walls, floors, and sink; use the sink sieve for food debris.",
      "Dispose of food waste in the dustbin daily. Air out mattresses weekly and report bedbugs immediately.",
      "Use your compulsory insecticide regularly across beds, wall cracks, and room corners. Seal openings to prevent rodents.",
      "Cooperate fully with management fumigation exercises. Participate in compulsory monthly general sanitation of the hostel.",
    ],
  },
  {
    title: "8. Communication & Complaints",
    rules: [
      "Use your profile account on skyhostel.ng to log complaints or issues for prompt attention.",
      "Also relay concerns directly to the porter desk for immediate action.",
    ],
  },
  {
    title: "9. Penalties",
    rules: [
      "Any room found violating these rules may be penalized by having the room locked for the day, fined, or face eviction under the 3-strike rule.",
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
      <h2 className="text-2xl font-bold mb-6">
        Agreement, Rules and Regulations
      </h2>

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
          following rules for the 2026/2027 academic session.
        </p>
      </div>

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

      <div className="mb-8">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-300">
          <p className="text-sm font-semibold text-amber-950 mb-2">
            Required documents for entry (print & present)
          </p>
          <p className="text-sm text-amber-900 mb-2">
            After you complete registration, you will receive three documents to
            download. You must print them and present them at the gate on
            resumption day. Entry may be refused without them:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-900">
            <li>Rules &amp; Regulations</li>
            <li>Resumption Agreement &amp; Checklist (signed)</li>
            <li>Gate Verification Checklist (for the porter)</li>
          </ul>
        </div>
      </div>

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

      <div className="mb-6">
        <Label className="text-base font-medium">Signature Declaration *</Label>
        <div className="flex items-start mt-2">
          <input
            type="checkbox"
            id="rulesAccepted"
            checked={rulesAccepted}
            onChange={(e) => setRulesAccepted(e.target.checked)}
            className="w-4 h-4 mt-1 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="rulesAccepted" className="ml-3 text-sm text-gray-700">
            I hereby sign and declare that all the above information is accurate,
            I will abide by these rules, and I understand I must print and
            present the three resumption documents at entry or I may be refused
            access.
          </label>
        </div>
      </div>

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
