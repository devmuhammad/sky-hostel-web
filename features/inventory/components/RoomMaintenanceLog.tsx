"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { StatusBadge } from "@/shared/components/ui/status-badge";

interface RoomOption {
  id: string;
  name: string;
  block: string;
}

interface MaintenanceLog {
  id: string;
  room_id: string;
  check_date: string;
  issue_found: string;
  action_taken: string | null;
  status: string;
  officer_responsible: string | null;
  complaint_url: string | null;
  created_at: string;
  room?: { name: string; block: string } | null;
  creator?: { first_name: string; last_name: string; role: string } | null;
}

interface RoomMaintenanceLogProps {
  fixedRoomId?: string;
  canManageSettings?: boolean;
}

const STATUS_COLORS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

function roomLabel(room?: { name: string; block: string } | null) {
  if (!room) return "Unknown Room";
  return `${room.block}${String(room.name).replace(room.block, "")}`;
}

export function RoomMaintenanceLog({ fixedRoomId, canManageSettings = false }: RoomMaintenanceLogProps) {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintUrl, setComplaintUrl] = useState("");
  const [complaintDraft, setComplaintDraft] = useState("");
  const [isSavingComplaint, setIsSavingComplaint] = useState(false);
  const [logEdits, setLogEdits] = useState<Record<string, { status: string; action_taken: string }>>({});

  const [form, setForm] = useState({
    room_id: fixedRoomId || "",
    check_date: new Date().toISOString().split("T")[0],
    issue_found: "",
    action_taken: "",
    status: "pending",
    officer_responsible: "",
  });

  const fetchRooms = useCallback(async () => {
    if (fixedRoomId) return;
    try {
      const res = await fetch("/api/rooms?includeFull=true");
      const data = await res.json();
      if (data.success) setRooms(data.data || []);
    } catch (error) {
      console.error("Failed to load rooms", error);
    }
  }, [fixedRoomId]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = fixedRoomId
        ? `/api/admin/inventory/maintenance-logs?roomId=${fixedRoomId}`
        : "/api/admin/inventory/maintenance-logs";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const nextLogs: MaintenanceLog[] = data.data || [];
        setLogs(nextLogs);
        const edits: Record<string, { status: string; action_taken: string }> = {};
        for (const log of nextLogs) {
          edits[log.id] = { status: log.status, action_taken: log.action_taken || "" };
        }
        setLogEdits(edits);
      }
    } catch (error) {
      console.error("Failed to load maintenance logs", error);
    } finally {
      setIsLoading(false);
    }
  }, [fixedRoomId]);

  const fetchComplaintUrl = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/complaint-form");
      const data = await res.json();
      if (data.success) {
        setComplaintUrl(data.data?.url || "");
        setComplaintDraft(data.data?.url || "");
      }
    } catch (error) {
      console.error("Failed to load complaint form link", error);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchLogs();
    fetchComplaintUrl();
  }, [fetchRooms, fetchLogs, fetchComplaintUrl]);

  const handleSubmit = async () => {
    if (!form.room_id || !form.issue_found.trim()) {
      toast.error("Please select a room and describe the issue found.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/maintenance-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Maintenance check logged");
      setForm((prev) => ({
        ...prev,
        issue_found: "",
        action_taken: "",
        status: "pending",
        officer_responsible: "",
      }));
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to log maintenance check");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProgress = async (logId: string) => {
    const state = logEdits[logId];
    if (!state) return;
    try {
      const res = await fetch("/api/admin/inventory/maintenance-logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId, status: state.status, action_taken: state.action_taken }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Maintenance log updated");
      await fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Failed to update maintenance log");
    }
  };

  const handleSaveComplaintUrl = async () => {
    setIsSavingComplaint(true);
    try {
      const res = await fetch("/api/admin/settings/complaint-form", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: complaintDraft.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setComplaintUrl(data.data?.url || "");
      toast.success("Complaint form link saved");
    } catch (error: any) {
      toast.error(error.message || "Failed to save complaint form link");
    } finally {
      setIsSavingComplaint(false);
    }
  };

  const selectableRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => roomLabel(a).localeCompare(roomLabel(b), undefined, { numeric: true })),
    [rooms]
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Room Maintenance Log</h3>
          <p className="text-sm text-gray-500 mt-0.5">Record maintenance checks and track them to completion.</p>
        </div>
        {complaintUrl ? (
          <a
            href={complaintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Log a Complaint (Google Form)
          </a>
        ) : (
          <span className="text-xs text-gray-400">No complaint form link configured</span>
        )}
      </div>

      {canManageSettings && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <Label htmlFor="complaint_url" className="text-xs text-gray-600">
            Room Complaints Google Form Link
          </Label>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-2">
            <Input
              id="complaint_url"
              value={complaintDraft}
              onChange={(event) => setComplaintDraft(event.target.value)}
              placeholder="https://forms.gle/..."
              className="bg-white"
            />
            <LoadingButton
              onClick={handleSaveComplaintUrl}
              isLoading={isSavingComplaint}
              loadingText="Saving..."
              className="whitespace-nowrap"
            >
              Save Link
            </LoadingButton>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!fixedRoomId && (
            <div className="space-y-1.5">
              <Label htmlFor="mlog_room">Room Number</Label>
              <select
                id="mlog_room"
                value={form.room_id}
                onChange={(event) => setForm((prev) => ({ ...prev, room_id: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white py-2.5 px-3 text-sm outline-none"
              >
                <option value="">Select room</option>
                {selectableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {roomLabel(room)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="mlog_date">Date of Check</Label>
            <Input
              id="mlog_date"
              type="date"
              value={form.check_date}
              onChange={(event) => setForm((prev) => ({ ...prev, check_date: event.target.value }))}
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mlog_officer">Officer Responsible</Label>
            <Input
              id="mlog_officer"
              value={form.officer_responsible}
              onChange={(event) => setForm((prev) => ({ ...prev, officer_responsible: event.target.value }))}
              placeholder="Defaults to you"
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mlog_status">Status</Label>
            <select
              id="mlog_status"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white py-2.5 px-3 text-sm outline-none"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mlog_issue">Issue Found</Label>
          <textarea
            id="mlog_issue"
            value={form.issue_found}
            onChange={(event) => setForm((prev) => ({ ...prev, issue_found: event.target.value }))}
            rows={2}
            placeholder="Describe the issue found during the check..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white p-3 text-sm outline-none resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mlog_action">Action Taken</Label>
          <textarea
            id="mlog_action"
            value={form.action_taken}
            onChange={(event) => setForm((prev) => ({ ...prev, action_taken: event.target.value }))}
            rows={2}
            placeholder="What was done to resolve it (optional)..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white p-3 text-sm outline-none resize-none"
          />
        </div>

        <div className="flex justify-end">
          <LoadingButton onClick={handleSubmit} isLoading={isSubmitting} loadingText="Saving..." className="rounded-full px-6">
            Add Maintenance Check
          </LoadingButton>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading maintenance history...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No maintenance checks recorded yet.</p>
        ) : (
          logs.map((log) => {
            const state = logEdits[log.id] || { status: log.status, action_taken: log.action_taken || "" };
            return (
              <div key={log.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!fixedRoomId && (
                        <span className="text-sm font-semibold text-gray-900">{roomLabel(log.room)}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(log.check_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{log.issue_found}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Officer: {log.officer_responsible || "—"}
                      {log.creator && (
                        <span className="text-gray-400">
                          {" "}
                          · Logged by {log.creator.first_name} {log.creator.last_name}
                        </span>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={log.status} variant="custom" colorMap={STATUS_COLORS} />
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3">
                  <select
                    value={state.status}
                    onChange={(event) =>
                      setLogEdits((prev) => ({ ...prev, [log.id]: { ...state, status: event.target.value } }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input
                    value={state.action_taken}
                    onChange={(event) =>
                      setLogEdits((prev) => ({ ...prev, [log.id]: { ...state, action_taken: event.target.value } }))
                    }
                    placeholder="Action taken / progress note"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <Button onClick={() => handleSaveProgress(log.id)}>Save</Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
