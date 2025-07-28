"use client";

import { useState, useEffect } from "react";

interface ConsentItem {
  id: string;
  text: string;
  required?: boolean;
}

interface ConsentCheckboxesProps {
  items: ConsentItem[];
  onConsentChange: (consents: Record<string, boolean>) => void;
  className?: string;
}

export function ConsentCheckboxes({
  items,
  onConsentChange,
  className = "",
}: ConsentCheckboxesProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const handleConsentChange = (id: string, checked: boolean) => {
    const newConsents = { ...consents, [id]: checked };
    setConsents(newConsents);
    onConsentChange(newConsents);
  };

  const allRequiredChecked = items
    .filter((item) => item.required)
    .every((item) => consents[item.id]);

  // Notify parent component about consent status
  useEffect(() => {
    onConsentChange(consents);
  }, [consents, onConsentChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Important Information & Terms
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Please read and acknowledge the following terms before proceeding with
          payment:
        </p>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <input
                type="checkbox"
                id={item.id}
                checked={consents[item.id] || false}
                onChange={(e) => handleConsentChange(item.id, e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label
                htmlFor={item.id}
                className="text-sm text-blue-800 leading-relaxed cursor-pointer"
              >
                {item.text}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
          ))}
        </div>

        {!allRequiredChecked && (
          <p className="text-sm text-red-600 mt-3">
            * Please check all required items to proceed
          </p>
        )}

        {allRequiredChecked && (
          <p className="text-sm text-green-600 mt-3">
            ✓ All terms accepted. You can now proceed with payment.
          </p>
        )}
      </div>
    </div>
  );
}
