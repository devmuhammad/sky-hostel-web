"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/shared/components/ui/modal";
import { DetailGrid } from "@/shared/components/ui/detail-grid";
import { Button } from "@/shared/components/ui/button";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { Label } from "@/shared/components/ui/label";
import { Student } from "@/shared/store/appStore";
import { getStudentDetailSections } from "@/shared/constants/student-details";
import { ReportTimeline } from "@/features/student-reports/components/ReportTimeline";
import { useToast } from "@/shared/hooks/useToast";
import { useAppStore } from "@/shared/store/appStore";
import { RefundReasonModal } from "@/shared/components/ui/refund-reason-modal";
import { REFUND_ADMIN_ROLES } from "@/shared/utils/student-eligibility";

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export function StudentDetailModal({
  student,
  onClose,
}: StudentDetailModalProps) {
  const toast = useToast();
  const { updateStudent, students } = useAppStore();
  const [activeTab, setActiveTab] = useState<"overview" | "behaviour">(
    "overview"
  );
  const [role, setRole] = useState<string | null>(null);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [reason, setReason] = useState("");
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users/me");
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setRole(json.data?.role || null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveStudent =
    (student && students.find((s) => s.id === student.id)) || student;

  if (!liveStudent) return null;

  const isSuperAdmin = role === "super_admin";
  const canRefund = Boolean(
    role && (REFUND_ADMIN_ROLES as readonly string[]).includes(role)
  );
  const isWithdrawn = liveStudent.account_status === "withdrawn";
  const isBlacklisted = liveStudent.account_status === "blacklisted";
  const isBlocked = isBlacklisted || isWithdrawn || liveStudent.is_active === false;

  const handleBlacklist = async () => {
    if (reason.trim().length < 5) {
      toast.error("Enter a reason (at least 5 characters)");
      return;
    }

    setIsBlacklisting(true);
    try {
      const res = await fetch(
        `/api/admin/students/${liveStudent.id}/blacklist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to blacklist student");
      }

      if (json.data?.student) {
        updateStudent(liveStudent.id, json.data.student);
      }
      toast.success(
        json.data?.message ||
          "Student blacklisted and room bed released"
      );
      setShowBlacklist(false);
      setReason("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to blacklist student");
    } finally {
      setIsBlacklisting(false);
    }
  };

  const handleRefund = async () => {
    if (refundReason.trim().length < 5) {
      toast.error("Enter a reason (at least 5 characters)");
      return;
    }

    setIsRefunding(true);
    try {
      const res = await fetch(`/api/admin/students/${liveStudent.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to refund student");
      }

      if (json.data?.student) {
        updateStudent(liveStudent.id, json.data.student);
      }
      if (json.data?.payment?.id) {
        useAppStore.getState().updatePayment(json.data.payment.id, json.data.payment);
      }
      toast.success(
        json.data?.message ||
          "Payment refunded. Student cannot continue and bed was released."
      );
      setShowRefund(false);
      setRefundReason("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to refund student");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={!!student}
        onClose={() => {
          onClose();
          setActiveTab("overview");
          setShowBlacklist(false);
          setShowRefund(false);
        }}
        title={`Student Details - ${liveStudent.first_name} ${liveStudent.last_name}`}
        size="lg"
      >
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("behaviour")}
              className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "behaviour"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
            >
              Behaviour & Incidents
            </button>
          </nav>
        </div>

        <div className="mt-4 space-y-4">
          {(isBlocked || liveStudent.account_status) && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                isBlacklisted
                  ? "border-red-200 bg-red-50 text-red-800"
                  : isWithdrawn
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              Status:{" "}
              <strong>
                {(liveStudent.account_status || "active").replace("_", " ")}
              </strong>
              {liveStudent.previous_room && (
                <span className="ml-2 text-xs">
                  (was Room {liveStudent.previous_block}
                  {liveStudent.previous_room} ·{" "}
                  {liveStudent.previous_bedspace_label})
                </span>
              )}
              {liveStudent.deactivation_reason && (
                <p className="mt-1 text-xs">
                  Reason: {liveStudent.deactivation_reason}
                </p>
              )}
            </div>
          )}

          {activeTab === "overview" ? (
            <DetailGrid sections={getStudentDetailSections(liveStudent)} />
          ) : (
            <ReportTimeline studentId={liveStudent.id} />
          )}

          {!isBlocked && (canRefund || isSuperAdmin) && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              {canRefund && (
                <div>
                  <Button
                    onClick={() => setShowRefund(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Refund / withdraw student
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">
                    Refunds their payment, frees their bed, and blocks
                    payment and registration for this session.
                  </p>
                </div>
              )}
              {isSuperAdmin && (
                <div>
                  <Button
                    onClick={() => setShowBlacklist(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Blacklist / Reject student
                  </Button>
                  <p className="mt-2 text-xs text-slate-500">
                    Frees their bed, marks them inactive, and blocks
                    re-registration. Super admin only.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showBlacklist}
        onClose={() => setShowBlacklist(false)}
        title="Blacklist student"
        description="This will free their room bed and permanently block re-registration for this email/matric/phone."
        hideDefaultFooter
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="blacklist-reason">Reason *</Label>
            <textarea
              id="blacklist-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Why is this student being rejected / blacklisted?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowBlacklist(false)}
              className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <LoadingButton
              isLoading={isBlacklisting}
              onClick={handleBlacklist}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm blacklist
            </LoadingButton>
          </div>
        </div>
      </Modal>

      <RefundReasonModal
        isOpen={showRefund}
        title={`Refund ${liveStudent.first_name} ${liveStudent.last_name}`}
        description="This refunds their payment, withdraws them if they already registered, and frees their bed. They cannot continue at any stage."
        reason={refundReason}
        onReasonChange={setRefundReason}
        onClose={() => {
          setShowRefund(false);
          setRefundReason("");
        }}
        onConfirm={handleRefund}
        isSubmitting={isRefunding}
      />
    </>
  );
}
