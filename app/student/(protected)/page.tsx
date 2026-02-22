"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { FileUpload } from "@/shared/components/ui/file-upload";
import { useToast } from "@/shared/hooks/useToast";
import { createClientSupabaseClient } from "@/shared/config/auth";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  matric_number: string;
  faculty: string;
  department: string;
  level: string;
  block: string;
  room: string;
  bedspace_label: string;
  address?: string;
  state_of_origin?: string;
  lga?: string;
  marital_status?: string;
  religion?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_email?: string;
  next_of_kin_relationship?: string;
  payment?: {
    amount_to_pay: number;
    amount_paid: number;
    status: string;
    paid_at: string | null;
    invoice_id: string;
  } | null;
}

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
  updated_at: string;
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

export default function StudentPortalPage() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    "overview" | "profile" | "report" | "tickets" | "feedback"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tickets, setTickets] = useState<StudentTicket[]>([]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [issueImage, setIssueImage] = useState<File | null>(null);

  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    state_of_origin: "",
    lga: "",
    marital_status: "",
    religion: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_email: "",
    next_of_kin_relationship: "",
  });

  const [ticketForm, setTicketForm] = useState({
    title: "",
    category: "room_maintenance",
    priority: "medium",
    description: "",
    room_label: "",
  });

  const [feedbackForm, setFeedbackForm] = useState({
    message: "",
    rating: "",
  });
  const tabs: {
    key: "overview" | "profile" | "report" | "tickets" | "feedback";
    label: string;
  }[] = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "Profile" },
    { key: "report", label: "Report Issue" },
    { key: "tickets", label: "My Tickets" },
    { key: "feedback", label: "Feedback" },
  ];

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, ticketsRes] = await Promise.all([
        fetch("/api/student/me", { cache: "no-store" }),
        fetch("/api/student/tickets", { cache: "no-store" }),
      ]);

      const profileJson = await profileRes.json();
      const ticketsJson = await ticketsRes.json();

      if (!profileRes.ok || !profileJson.success) {
        throw new Error(profileJson.error || "Failed to load profile");
      }

      if (!ticketsRes.ok || !ticketsJson.success) {
        throw new Error(ticketsJson.error || "Failed to load tickets");
      }

      const student = profileJson.data as StudentProfile;
      setProfile(student);
      setTickets(ticketsJson.data || []);
      setTicketForm((prev) => ({
        ...prev,
        room_label: `${student.block}${student.room}`,
      }));
      setProfileForm({
        phone: student.phone || "",
        address: student.address || "",
        state_of_origin: student.state_of_origin || "",
        lga: student.lga || "",
        marital_status: student.marital_status || "",
        religion: student.religion || "",
        next_of_kin_name: student.next_of_kin_name || "",
        next_of_kin_phone: student.next_of_kin_phone || "",
        next_of_kin_email: student.next_of_kin_email || "",
        next_of_kin_relationship: student.next_of_kin_relationship || "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load student portal data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "open").length,
    [tickets]
  );
  const inProgressCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "in_progress").length,
    [tickets]
  );

  const resolvedCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === "resolved").length,
    [tickets]
  );

  const saveProfile = async () => {
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/student/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully");
      setProfile(result.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const createTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsCreatingTicket(true);

    try {
      let imageUrl: string | null = null;

      if (issueImage && profile?.id) {
        const supabase = createClientSupabaseClient();
        const fileExt = issueImage.name.split(".").pop() || "jpg";
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        const filePath = `student-tickets/${fileName}`;
        const buckets = ["documents", "student-documents"];

        let uploaded = false;
        let uploadErrorMessage = "";

        for (const bucket of buckets) {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, issueImage, { upsert: true });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            imageUrl = publicData.publicUrl;
            uploaded = true;
            break;
          }

          uploadErrorMessage = uploadError.message;
        }

        if (!uploaded) {
          throw new Error(
            uploadErrorMessage ||
              "Failed to upload issue image. Please contact admin."
          );
        }
      }

      const response = await fetch("/api/student/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ticketForm,
          image_url: imageUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit issue");
      }

      toast.success("Issue submitted", {
        description: "Your ticket has been sent to the support team.",
      });

      setTicketForm((prev) => ({ ...prev, title: "", description: "" }));
      setIssueImage(null);
      await loadData();
      setActiveTab("tickets");
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const submitFeedback = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmittingFeedback(true);

    try {
      const response = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...feedbackForm,
          rating: feedbackForm.rating ? Number(feedbackForm.rating) : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit feedback");
      }

      toast.success("Feedback submitted");
      setFeedbackForm({ message: "", rating: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load student profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Welcome, {profile.first_name}</h2>
        <p className="mt-1 text-sm text-slate-600">Track your room, payments, and hostel support requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Open Tickets</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{openCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">In Progress</p>
          <p className="mt-2 text-3xl font-semibold text-blue-700">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Resolved</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{resolvedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Payment Status</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {(profile.payment?.status || "pending").replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Room Assignment</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Block</p>
                <p className="font-medium text-slate-900">{profile.block}</p>
              </div>
              <div>
                <p className="text-slate-500">Room</p>
                <p className="font-medium text-slate-900">{profile.room}</p>
              </div>
              <div>
                <p className="text-slate-500">Bedspace</p>
                <p className="font-medium text-slate-900">{profile.bedspace_label || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500">Matric Number</p>
                <p className="font-medium text-slate-900">{profile.matric_number}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-semibold text-slate-900">Payment</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Paid</span>
                <span className="font-semibold text-slate-900">N{(profile.payment?.amount_paid || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Amount Due</span>
                <span className="font-semibold text-slate-900">N{(profile.payment?.amount_to_pay || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Invoice</span>
                <span className="font-medium text-slate-700">{profile.payment?.invoice_id || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {(profile.payment?.status || "pending").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Update Profile</h3>
          <p className="mt-1 text-sm text-slate-600">You can update personal contact and next-of-kin details.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={profileForm.address} onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>State of Origin</Label>
              <Input value={profileForm.state_of_origin} onChange={(e) => setProfileForm((prev) => ({ ...prev, state_of_origin: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>LGA</Label>
              <Input value={profileForm.lga} onChange={(e) => setProfileForm((prev) => ({ ...prev, lga: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Marital Status</Label>
              <Input value={profileForm.marital_status} onChange={(e) => setProfileForm((prev) => ({ ...prev, marital_status: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Religion</Label>
              <Input value={profileForm.religion} onChange={(e) => setProfileForm((prev) => ({ ...prev, religion: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Next of Kin Name</Label>
              <Input value={profileForm.next_of_kin_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, next_of_kin_name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Next of Kin Phone</Label>
              <Input value={profileForm.next_of_kin_phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, next_of_kin_phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Next of Kin Email</Label>
              <Input type="email" value={profileForm.next_of_kin_email} onChange={(e) => setProfileForm((prev) => ({ ...prev, next_of_kin_email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Input value={profileForm.next_of_kin_relationship} onChange={(e) => setProfileForm((prev) => ({ ...prev, next_of_kin_relationship: e.target.value }))} />
            </div>
          </div>

          <div className="mt-5">
            <LoadingButton
              type="button"
              isLoading={isSavingProfile}
              loadingText="Saving..."
              onClick={saveProfile}
              className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Save Changes
            </LoadingButton>
          </div>
        </div>
      )}

      {activeTab === "report" && (
        <form onSubmit={createTicket} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Report an Issue</h3>
          <p className="mt-1 text-sm text-slate-600">Tell us what needs attention and the porter team will follow up.</p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Issue Title</Label>
              <Input
                value={ticketForm.title}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Broken wardrobe hinge"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={ticketForm.category}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="room_maintenance">Room Maintenance</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="furniture">Furniture</option>
                <option value="security">Security</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={ticketForm.priority}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Room Label</Label>
              <Input
                value={ticketForm.room_label}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, room_label: e.target.value }))}
                placeholder="e.g. A25"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Description</Label>
              <textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Describe the issue clearly..."
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label>Issue Image (Optional)</Label>
              <FileUpload
                onFileSelect={setIssueImage}
                maxSize={5}
                accept="image/*"
                className="[&>div]:rounded-md [&>div]:border-slate-200 [&>div]:bg-slate-50"
              />
            </div>
          </div>

          <div className="mt-5">
            <LoadingButton
              type="submit"
              isLoading={isCreatingTicket}
              loadingText="Submitting..."
              className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Submit Issue
            </LoadingButton>
          </div>
        </form>
      )}

      {activeTab === "tickets" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">My Tickets</h3>
          <p className="mt-1 text-sm text-slate-600">Track progress of your reported issues in real-time.</p>

          <div className="mt-5 space-y-3">
            {tickets.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No tickets yet. Use "Report Issue" to raise one.
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-medium text-slate-900">{ticket.title}</p>
                      <p className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-700">{ticket.description}</p>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 md:grid-cols-3">
                    <p>Category: <span className="font-medium text-slate-700">{ticket.category.replace("_", " ")}</span></p>
                    <p>Priority: <span className="font-medium text-slate-700">{ticket.priority}</span></p>
                    <p>Room: <span className="font-medium text-slate-700">{ticket.room_label || "N/A"}</span></p>
                  </div>

                  {ticket.image_url && (
                    <div className="mt-3">
                      <a
                        href={ticket.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        View attached image
                      </a>
                      <img
                        src={ticket.image_url}
                        alt="Issue attachment"
                        className="mt-2 h-32 w-32 rounded-md border border-slate-200 object-cover"
                      />
                    </div>
                  )}

                  {(ticket.assigned_staff || ticket.resolution_note) && (
                    <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                      {ticket.assigned_staff && (
                        <p className="text-slate-600">
                          Assigned to: <span className="font-medium text-slate-800">{ticket.assigned_staff.first_name} {ticket.assigned_staff.last_name} ({ticket.assigned_staff.role})</span>
                        </p>
                      )}
                      {ticket.resolution_note && (
                        <p className="mt-1 text-slate-600">Update: <span className="font-medium text-slate-800">{ticket.resolution_note}</span></p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <form onSubmit={submitFeedback} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-base font-semibold text-slate-900">Feedback</h3>
          <p className="mt-1 text-sm text-slate-600">Share your experience to help us improve hostel operations.</p>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label>Rating (Optional)</Label>
              <select
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm md:max-w-xs"
                value={feedbackForm.rating}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: e.target.value }))}
              >
                <option value="">Select rating</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Fair</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Poor</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <textarea
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, message: e.target.value }))}
                className="min-h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Write your feedback..."
                required
              />
            </div>
          </div>

          <div className="mt-5">
            <LoadingButton
              type="submit"
              isLoading={isSubmittingFeedback}
              loadingText="Submitting..."
              className="rounded-lg bg-slate-900 text-white hover:bg-slate-800"
            >
              Submit Feedback
            </LoadingButton>
          </div>
        </form>
      )}
    </div>
  );
}
