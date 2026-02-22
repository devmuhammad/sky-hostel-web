"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/shared/components/ui/data-table";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { LoadingButton } from "@/shared/components/ui/loading-button";
import { toast } from "sonner";
import { Modal } from "@/shared/components/ui/modal";
import { DailyLogForm } from "@/features/daily-logs/components/DailyLogForm";
import { EmptyState } from "@/shared/components/ui/empty-state";

export default function DailyLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingLog, setIsCreatingLog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [clarificationComment, setClarificationComment] = useState("");
  const [approvalComment, setApprovalComment] = useState("");
  const [isApprovingLog, setIsApprovingLog] = useState(false);

  const fetchUserRole = async () => {
    try {
      const res = await fetch("/api/admin/users/me");
      const data = await res.json();
      if (data.success && data.data) {
        setCurrentUserRole(data.data.role);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/daily-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error("Failed to load daily logs", error);
      toast.error("Failed to load logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchLogs();
  }, []);

  const canReview = currentUserRole ? ["super_admin", "admin", "hostel_manager"].includes(currentUserRole) : false;

  const handleSubmitLog = async (data: any) => {
    const res = await fetch("/api/admin/daily-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.error);
    toast.success("Log submitted successfully");
    setIsCreatingLog(false);
    fetchLogs();
  };

  const handleReviewLog = async (id: string, status: string, comments: string) => {
    try {
      const res = await fetch(`/api/admin/daily-logs/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supervisor_status: status, supervisor_comments: comments }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast.success(`Log marked as ${status}`);
      setSelectedLog(null);
      setApprovalComment("");
      fetchLogs();
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to review log");
      return false;
    }
  };

  const closeClarificationModal = () => {
    setIsClarificationModalOpen(false);
    setClarificationComment("");
  };

  const handleRequestClarification = async () => {
    if (!selectedLog) return;
    const trimmedComment = clarificationComment.trim();
    if (!trimmedComment) {
      toast.error("Please enter a clarification note.");
      return;
    }
    const success = await handleReviewLog(selectedLog.id, "requires_clarification", trimmedComment);
    if (success) closeClarificationModal();
  };

  const handleApproveLog = async () => {
    if (!selectedLog) return;
    setIsApprovingLog(true);
    const commentToSend = approvalComment.trim() || "Looks good.";
    await handleReviewLog(selectedLog.id, "approved", commentToSend);
    setIsApprovingLog(false);
  };

  const columns = [
    { 
      header: "Staff", 
      key: "staff", 
      render: (item: any) => item.staff ? `${item.staff.first_name} ${item.staff.last_name}` : "Unknown" 
    },
    { 
      header: "Date", 
      key: "log_date", 
      render: (item: any) => new Date(item.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    },
    { 
      header: "Shift", 
      key: "shift", 
      render: (item: any) => <span className="capitalize">{item.shift}</span> 
    },
    { header: "Primary Duty", key: "duty_type", render: (item: any) => item.duty_type },
    { 
      header: "Status", 
      key: "supervisor_status", 
      render: (item: any) => {
        const variantMap: Record<string, any> = {
          pending: "warning",
          approved: "success",
          requires_clarification: "error"
        };
        const labels: Record<string, string> = {
          pending: "Pending Review",
          approved: "Approved",
          requires_clarification: "Needs Clarification"
        };
        return <StatusBadge status={labels[item.supervisor_status] || item.supervisor_status} variant={variantMap[item.supervisor_status] || "default"} />;
      }
    },
    {
      header: "Actions",
      key: "actions",
      render: (item: any) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedLog(item)}
        >
          {canReview ? "View & Review" : "View Details"}
        </Button>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-12 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Daily Logs</h2>
            <p className="text-sm text-gray-500 mt-1">Submit, review, and approve daily operational reports.</p>
          </div>
          <Button onClick={() => setIsCreatingLog(true)} className="rounded-full px-6 whitespace-nowrap">
            Submit New Log
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {logs.length > 0 || isLoading ? (
            <div className="p-1">
              <DataTable 
                data={logs} 
                columns={columns} 
                searchFields={["duty_type", "activities"]} 
                loading={isLoading} 
                noShadow 
              />
            </div>
          ) : (
            <div className="py-12">
              <EmptyState 
                title="No Daily Logs"
                description="There are currently no daily logs submitted."
              />
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={isCreatingLog} 
        onClose={() => setIsCreatingLog(false)}
        title="Submit New Daily Log"
        hideDefaultFooter
      >
        <DailyLogForm 
          onSubmitAction={handleSubmitLog} 
          onCancel={() => setIsCreatingLog(false)} 
        />
      </Modal>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => {
          setSelectedLog(null);
          setApprovalComment("");
          closeClarificationModal();
        }}
        title="Review Daily Log"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 font-medium">Staff Member</p>
                <p className="text-gray-900">{selectedLog.staff?.first_name} {selectedLog.staff?.last_name} ({selectedLog.staff?.role})</p>
              </div>
              <div>
                <p className="text-gray-500 font-medium">Date & Shift</p>
                <p className="text-gray-900 capitalize">{new Date(selectedLog.log_date).toLocaleDateString()} - {selectedLog.shift}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Primary Duty</p>
                <p className="text-gray-900">{selectedLog.duty_type}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 font-medium">Activities Completed</p>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedLog.activities}</p>
              </div>
              {selectedLog.issues_observed && (
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium">Issues Observed</p>
                  <p className="text-gray-900 whitespace-pre-wrap bg-red-50 p-3 rounded-lg border border-red-100">{selectedLog.issues_observed}</p>
                </div>
              )}
              {selectedLog.materials_used && (
                <div className="col-span-2">
                  <p className="text-gray-500 font-medium">Materials Used</p>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-100">{selectedLog.materials_used}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Supervisor Review</h4>
              {selectedLog.supervisor_status !== 'pending' && selectedLog.supervisor ? (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium">
                    Reviewed by {selectedLog.supervisor.first_name} {selectedLog.supervisor.last_name} 
                    <span className="ml-2 font-normal text-gray-500">
                      ({new Date(selectedLog.updated_at).toLocaleDateString()})
                    </span>
                  </p>
                  <p className="text-sm mt-1">{selectedLog.supervisor_comments}</p>
                </div>
              ) : null}

              {canReview && selectedLog.supervisor_status === 'pending' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="approval-comment" className="text-sm text-gray-600 font-medium">
                      Review Comment (Optional)
                    </label>
                    <textarea
                      id="approval-comment"
                      value={approvalComment}
                      onChange={(event) => setApprovalComment(event.target.value)}
                      rows={3}
                      placeholder="Add an optional review note for this approval..."
                      className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={isApprovingLog}
                    onClick={() => setIsClarificationModalOpen(true)}
                  >
                    Request Clarification
                  </Button>
                  <LoadingButton
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApproveLog}
                    isLoading={isApprovingLog}
                    loadingText="Approving..."
                  >
                    Approve Log
                  </LoadingButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isClarificationModalOpen}
        onClose={closeClarificationModal}
        title="Request Clarification"
        size="md"
        hideDefaultFooter
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add details so the staff member knows what to update in this daily log.
          </p>
          <textarea
            value={clarificationComment}
            onChange={(event) => setClarificationComment(event.target.value)}
            rows={5}
            placeholder="Write your clarification request..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeClarificationModal}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRequestClarification}
              disabled={!clarificationComment.trim()}
            >
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
