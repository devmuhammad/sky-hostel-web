"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";
import { RESUMPTION_SESSION } from "@/shared/constants/resumption-documents";

type VerificationStatus = "pending" | "cleared" | "denied";

interface SearchResult {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  block: string;
  room: string;
  bedspace_label: string;
  passport_photo_url?: string | null;
  resumption_status: VerificationStatus;
}

interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  is_mandatory: boolean;
  present: boolean | null;
  sold_at_gate: boolean | null;
}

interface VerificationBundle {
  student: SearchResult & {
    faculty?: string;
    department?: string;
    level?: string;
  };
  verification: {
    id: string;
    status: VerificationStatus;
    agreement_submitted: boolean;
    denied_reason: string | null;
    cleared_at: string | null;
  } | null;
  checklist: ChecklistItem[];
}

const STATUS_STYLES: Record<VerificationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  cleared: "bg-emerald-50 text-emerald-800 border-emerald-200",
  denied: "bg-red-50 text-red-800 border-red-200",
};

export default function ResumptionCheckinPage() {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [bundle, setBundle] = useState<VerificationBundle | null>(null);
  const [itemState, setItemState] = useState<
    Record<string, { present: boolean | null; sold_at_gate: boolean | null }>
  >({});
  const [deniedReason, setDeniedReason] = useState("");

  const searchStudents = useCallback(async () => {
    if (query.trim().length < 2) {
      toast.error("Enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    setBundle(null);
    try {
      const response = await fetch(
        `/api/admin/resumption-checkin?q=${encodeURIComponent(query.trim())}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Search failed");
      }
      setResults(result.data || []);
      if ((result.data || []).length === 0) {
        toast.error("No students found");
      }
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, [query, toast]);

  const loadStudent = async (studentId: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/admin/resumption-checkin?student_id=${encodeURIComponent(studentId)}`
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load checklist");
      }

      const data = result.data as VerificationBundle;
      setBundle(data);
      setDeniedReason(data.verification?.denied_reason || "");

      const nextState: Record<
        string,
        { present: boolean | null; sold_at_gate: boolean | null }
      > = {};
      for (const item of data.checklist || []) {
        nextState[item.id] = {
          present: item.present,
          sold_at_gate: item.sold_at_gate,
        };
      }
      setItemState(nextState);
      setResults([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to load checklist");
    } finally {
      setIsSearching(false);
    }
  };

  const saveVerification = async (status?: VerificationStatus) => {
    if (!bundle?.student?.id) return;

    setIsSaving(true);
    try {
      const item_checks = Object.entries(itemState).map(([item_id, value]) => ({
        item_id,
        present: value.present,
        sold_at_gate: value.sold_at_gate,
      }));

      const response = await fetch("/api/admin/resumption-checkin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: bundle.student.id,
          session: RESUMPTION_SESSION,
          status,
          denied_reason: deniedReason,
          item_checks,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save verification");
      }

      const data = result.data as VerificationBundle;
      setBundle(data);

      const nextState: Record<
        string,
        { present: boolean | null; sold_at_gate: boolean | null }
      > = {};
      for (const item of data.checklist || []) {
        nextState[item.id] = {
          present: item.present,
          sold_at_gate: item.sold_at_gate,
        };
      }
      setItemState(nextState);

      toast.success(
        status === "cleared"
          ? "Entry granted and recorded"
          : status === "denied"
            ? "Entry denied and recorded"
            : "Checklist saved"
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to save verification");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Resumption Check-in
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Session {RESUMPTION_SESSION}. Search a student, verify mandatory
          items at the gate, then grant or deny entry.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <Label htmlFor="search">Search student</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchStudents();
            }}
            placeholder="Name, matric, email, phone, or room"
          />
          <LoadingButton
            onClick={searchStudents}
            isLoading={isSearching}
            className="sm:w-40"
          >
            Search
          </LoadingButton>
        </div>

        {results.length > 0 && (
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {results.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => loadStudent(student.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs text-slate-600">
                    {student.matric_number} · Room {student.block}
                    {student.room} · {student.bedspace_label}
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${STATUS_STYLES[student.resumption_status]}`}
                >
                  {student.resumption_status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {bundle && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                {bundle.student.passport_photo_url ? (
                  <Image
                    src={bundle.student.passport_photo_url}
                    alt="Passport"
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
                    No photo
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {bundle.student.first_name} {bundle.student.last_name}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {bundle.student.matric_number} · {bundle.student.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    Room {bundle.student.block}
                    {bundle.student.room} · Bunk {bundle.student.bedspace_label}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[bundle.verification?.status || "pending"]}`}
              >
                {(bundle.verification?.status || "pending").replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-medium text-slate-900">
              Gate verification checklist
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Mark Present (YES) only after physical inspection. Do not grant
              entry until every mandatory item is YES.
            </p>

            <div className="mt-4 space-y-3">
              {bundle.checklist.map((item, index) => {
                const state = itemState[item.id] || {
                  present: null,
                  sold_at_gate: null,
                };
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-slate-100 p-3 md:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {index + 1}. {item.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-slate-500">
                        Present
                      </span>
                      <select
                        value={
                          state.present === true
                            ? "yes"
                            : state.present === false
                              ? "no"
                              : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setItemState((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...state,
                              present:
                                value === "yes"
                                  ? true
                                  : value === "no"
                                    ? false
                                    : null,
                            },
                          }));
                        }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      >
                        <option value="">—</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase text-slate-500">
                        Sold at gate
                      </span>
                      <select
                        value={
                          state.sold_at_gate === true
                            ? "yes"
                            : state.sold_at_gate === false
                              ? "no"
                              : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setItemState((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...state,
                              sold_at_gate:
                                value === "yes"
                                  ? true
                                  : value === "no"
                                    ? false
                                    : null,
                            },
                          }));
                        }}
                        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                      >
                        <option value="">—</option>
                        <option value="yes">YES</option>
                        <option value="no">NO</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="deniedReason">Remarks / missing items</Label>
              <textarea
                id="deniedReason"
                value={deniedReason}
                onChange={(e) => setDeniedReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="Required when denying entry"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <LoadingButton
                isLoading={isSaving}
                onClick={() => saveVerification()}
                className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              >
                Save progress
              </LoadingButton>
              <LoadingButton
                isLoading={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => saveVerification("cleared")}
              >
                Entry Granted
              </LoadingButton>
              <LoadingButton
                isLoading={isSaving}
                className="bg-red-600 hover:bg-red-700"
                onClick={() => saveVerification("denied")}
              >
                Entry Denied
              </LoadingButton>
              <Button
                onClick={() => setBundle(null)}
                className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              >
                Clear selection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
