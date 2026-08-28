"use client";

import { useState } from "react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";
import { useAppStore } from "@/shared/store/appStore";

export function SponsorPaymentForm() {
  const toast = useToast();
  const { addPayment, setPayments } = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    reason: "",
  });
  const [registrationHint, setRegistrationHint] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationHint(null);
    try {
      const res = await fetch("/api/admin/payments/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to waive payment");
      }

      if (json.data?.payment) {
        addPayment(json.data.payment);
      }

      try {
        const listRes = await fetch("/api/payments");
        const listJson = await listRes.json();
        if (listRes.ok && listJson.success && listJson.payments) {
          setPayments(listJson.payments);
        }
      } catch {
        // optional refresh
      }

      toast.success(
        json.data?.message ||
          "Payment waived — student can register and pick a room"
      );
      setRegistrationHint(json.data?.registration_hint || null);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        reason: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to waive payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 lg:p-5">
      <h2 className="text-lg font-semibold text-emerald-950">
        Waive payment (sponsored student)
      </h2>
      <p className="mt-1 text-sm text-emerald-900">
        Super admin only. Creates a completed payment so the student can open
        registration and pick a room without Paycashless.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="sponsor-first">First name</Label>
          <Input
            id="sponsor-first"
            value={form.first_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, first_name: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="sponsor-last">Last name</Label>
          <Input
            id="sponsor-last"
            value={form.last_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, last_name: e.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="sponsor-email">Email *</Label>
          <Input
            id="sponsor-email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="sponsor-phone">Phone *</Label>
          <Input
            id="sponsor-phone"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="sponsor-reason">Reason *</Label>
          <textarea
            id="sponsor-reason"
            value={form.reason}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reason: e.target.value }))
            }
            rows={3}
            className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. Sponsored by XYZ — paid outside app on 28 Aug"
          />
        </div>
      </div>

      <div className="mt-4">
        <LoadingButton
          isLoading={isSubmitting}
          onClick={handleSubmit}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          Waive payment & unlock registration
        </LoadingButton>
      </div>

      {registrationHint && (
        <p className="mt-3 text-sm text-emerald-900">
          Send the student to:{" "}
          <a
            href={registrationHint}
            className="font-semibold underline"
            target="_blank"
            rel="noreferrer"
          >
            {registrationHint}
          </a>
        </p>
      )}
    </div>
  );
}
