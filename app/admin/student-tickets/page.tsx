"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { useToast } from "@/shared/hooks/useToast";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface StudentTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: TicketStatus;
  room_label: string | null;
  image_url: string | null;
  resolution_note: string | null;
  created_at: string;
  student?: {
    first_name: string;
    last_name: string;
    matric_number: string;
    email: string;
    block: string;
    room: string;
  } | null;
  assigned_staff?: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StudentTicketsAdminPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<StudentTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, { status: TicketStatus; resolution_note: string }>>({});

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/student-tickets", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load tickets");
      }

      setTickets(result.data || []);
      const nextFormState: Record<string, { status: TicketStatus; resolution_note: string }> = {};
      for (const ticket of result.data || []) {
        nextFormState[ticket.id] = {
          status: ticket.status,
          resolution_note: ticket.resolution_note || "",
        };
      }
      setFormState(nextFormState);
    } catch (error: any) {
      toast.error(error.message || "Failed to load student tickets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((ticket) => ticket.status === statusFilter);
  }, [tickets, statusFilter]);

  const updateTicket = async (ticketId: string) => {
    const state = formState[ticketId];
    if (!state) return;

    setSavingId(ticketId);
    try {
      const response = await fetch(`/api/admin/student-tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update ticket");
      }

      toast.success("Ticket updated");
      await loadTickets();
    } catch (error: any) {
      toast.error(error.message || "Failed to update ticket");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Student Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-600">Porters and admins can track and update ticket progress here.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((row) => (
            <div key={row} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No tickets found for this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const state = formState[ticket.id] || {
              status: ticket.status,
              resolution_note: ticket.resolution_note || "",
            };

            return (
              <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{ticket.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
                  </div>
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <p>
                    Student: <span className="font-medium text-slate-900">{ticket.student ? `${ticket.student.first_name} ${ticket.student.last_name}` : "N/A"}</span>
                  </p>
                  <p>
                    Matric: <span className="font-medium text-slate-900">{ticket.student?.matric_number || "N/A"}</span>
                  </p>
                  <p>
                    Room: <span className="font-medium text-slate-900">{ticket.room_label || `${ticket.student?.block || ""}${ticket.student?.room || ""}` || "N/A"}</span>
                  </p>
                  <p>
                    Priority: <span className="font-medium text-slate-900">{ticket.priority}</span>
                  </p>
                  <p>
                    Category: <span className="font-medium text-slate-900">{ticket.category.replace("_", " ")}</span>
                  </p>
                  <p>
                    Assigned: <span className="font-medium text-slate-900">{ticket.assigned_staff ? `${ticket.assigned_staff.first_name} ${ticket.assigned_staff.last_name}` : "Unassigned"}</span>
                  </p>
                </div>

                {ticket.image_url && (
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                    <a
                      href={ticket.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Open attached image
                    </a>
                    <img
                      src={ticket.image_url}
                      alt="Ticket attachment"
                      className="mt-2 h-32 w-32 rounded-md border border-slate-200 object-cover"
                    />
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase text-slate-500">Update Status</label>
                    <select
                      value={state.status}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          [ticket.id]: {
                            ...state,
                            status: event.target.value as TicketStatus,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium uppercase text-slate-500">Resolution / Progress Note</label>
                    <textarea
                      value={state.resolution_note}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          [ticket.id]: {
                            ...state,
                            resolution_note: event.target.value,
                          },
                        }))
                      }
                      className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Add update the student can track"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <LoadingButton
                    type="button"
                    isLoading={savingId === ticket.id}
                    loadingText="Saving..."
                    onClick={() => updateTicket(ticket.id)}
                    className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Save Update
                  </LoadingButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
