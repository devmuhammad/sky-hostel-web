"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LeaveRequestForm } from "@/features/leave-requests/components/LeaveRequestForm";

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = useCallback(async (dbUserId?: string) => {
    setIsLoading(true);
    try {
      const url = dbUserId ? `/api/admin/leave-requests?userId=${dbUserId}` : "/api/admin/leave-requests";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Failed to load leave requests", error);
      toast.error("Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserRole = useCallback(async () => {
    try {
      // In a real scenario we might have an endpoint for this, or extract it from JWT
      // Wait, we need the user DB ID. Let's fetch it from another endpoint or user profile.
      // E.g. /api/admin/users/me
      const res = await fetch("/api/admin/users/me");
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentUserRole(data.data.role);
        setCurrentUserId(data.data.id);
        fetchRequests(data.data.id);
      } else {
        fetchRequests(); // fallback
      }
    } catch (error) {
      console.error(error);
      fetchRequests();
    }
  }, [fetchRequests]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const handleSubmitRequest = async (data: any) => {
    try {
      if (!currentUserId) {
        toast.error("User ID not found, unable to submit.");
        return;
      }
      const res = await fetch("/api/admin/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Failed to submit leave request");
      toast.success("Leave request submitted successfully");
      setIsCreatingRequest(false);
      fetchRequests(currentUserId);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit leave request");
    }
  };

  const handleReviewRequest = async (id: string, status: string, comments?: string) => {
    try {
      const res = await fetch(`/api/admin/leave-requests/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: status, 
          approved_by: currentUserId,
          rejection_reason: comments 
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast.success(`Request marked as ${status}`);
      setSelectedRequest(null);
      fetchRequests(currentUserId!);
    } catch (error: any) {
      toast.error(error.message || "Failed to review request");
    }
  };

  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectionReason("");
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      toast.error("Please enter a reason for rejection.");
      return;
    }
    await handleReviewRequest(selectedRequest.id, "rejected", reason);
    closeRejectModal();
  };

  const canReview = currentUserRole ? ["super_admin", "admin", "hostel_manager"].includes(currentUserRole) : false;

  const columns = [
    { 
      header: "Staff", 
      key: "staff", 
      render: (item: any) => item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : "Unknown" 
    },
    { 
      header: "Start Date", 
      key: "start_date", 
      render: (item: any) => new Date(item.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    },
    { 
      header: "End Date", 
      key: "end_date", 
      render: (item: any) => new Date(item.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    },
    { 
      header: "Reason", 
      key: "reason", 
      render: (item: any) => (
        <span className="truncate max-w-xs inline-block" title={item.reason}>
          {item.reason}
        </span>
      )
    },
    { 
      header: "Status", 
      key: "status", 
      render: (item: any) => {
        const variantMap: Record<string, any> = {
          pending: "warning",
          approved: "success",
          rejected: "error"
        };
        const labels: Record<string, string> = {
          pending: "Pending Review",
          approved: "Approved",
          rejected: "Rejected"
        };
        return <StatusBadge status={labels[item.status] || item.status} variant={variantMap[item.status] || "default"} />;
      }
    }
  ];

  if (canReview) {
    columns.push({
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedRequest(item)}
        >
          View & Review
        </Button>
      )
    });
  } else {
    columns.push({
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedRequest(item)}
        >
          View View
        </Button>
      )
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Submit or review requests for time off and absences.</p>
          </div>
          <Button onClick={() => setIsCreatingRequest(true)} className="rounded-full px-6 shadow-sm whitespace-nowrap">
            Request Leave
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {requests.length > 0 || isLoading ? (
            <div className="p-1">
              <DataTable 
                data={requests} 
                columns={columns} 
                searchFields={["reason"]} 
                loading={isLoading} 
                noShadow 
              />
            </div>
          ) : (
            <div className="py-12">
              <EmptyState 
                title="No Leave Requests"
                description="There are currently no leave requests."
              />
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isCreatingRequest} 
        onClose={() => setIsCreatingRequest(false)}
        title="Submit Leave Request"
        hideDefaultFooter
      >
        {currentUserId ? (
          <LeaveRequestForm 
            staffId={currentUserId}
            onSubmitAction={handleSubmitRequest} 
            onCancel={() => setIsCreatingRequest(false)} 
          />
        ) : (
          <div className="text-center py-6 text-gray-500">
            Fetching user information...
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => {
          setSelectedRequest(null);
          closeRejectModal();
        }}
        title="Leave Request Details"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Staff Member</p>
                <p className="text-gray-900">{selectedRequest.staff?.first_name} {selectedRequest.staff?.last_name} ({selectedRequest.staff?.role})</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Start Date</p>
                <p className="text-gray-900 font-semibold">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">End Date</p>
                <p className="text-gray-900 font-semibold">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Reason for Leave</p>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedRequest.reason}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Status</h4>
              {selectedRequest.status !== 'pending' && selectedRequest.approver ? (
                <div className={`${selectedRequest.status === 'approved' ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'} border p-4 rounded-xl mb-4`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className={`text-sm font-semibold ${selectedRequest.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                      {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                    </p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${selectedRequest.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      Final Decision
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    By {selectedRequest.approver.first_name} {selectedRequest.approver.last_name}
                  </p>
                  {selectedRequest.rejection_reason && (
                    <p className="text-sm mt-3 text-gray-700 bg-white/70 border border-red-100 rounded-lg p-3">
                      <strong>Reason:</strong> {selectedRequest.rejection_reason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Pending Review</p>
                        <p className="text-xs text-amber-700/90 mt-0.5">Awaiting supervisor decision.</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      In Queue
                    </span>
                  </div>
                </div>
              )}

              {canReview && selectedRequest.status === 'pending' && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2.5">Review Actions</p>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      className="text-red-700 border-red-200 bg-white hover:bg-red-50 rounded-lg"
                      onClick={() => setIsRejectModalOpen(true)}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                      onClick={() => handleReviewRequest(selectedRequest.id, 'approved')}
                    >
                      Approve Request
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        title="Reject Leave Request"
        size="md"
        hideDefaultFooter
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add a reason so the staff member understands why this request was rejected.
          </p>
          <textarea
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            rows={5}
            placeholder="Write rejection reason..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeRejectModal}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectRequest}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
