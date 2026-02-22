import { useEffect, useState } from "react";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingSkeleton } from "@/shared/components/ui/loading-skeleton";
import { ReportForm } from "./ReportForm";

interface Report {
  id: string;
  category: string;
  severity: string;
  title: string;
  comments: string;
  evidence_url: string | null;
  status: string;
  created_at: string;
  reporter: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

export function ReportTimeline({ studentId }: { studentId: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${studentId}/reports`);
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [studentId]);

  if (isCreating) {
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-4">New Report</h3>
        <ReportForm 
          studentId={studentId} 
          onSuccess={() => { setIsCreating(false); fetchReports(); }} 
          onCancel={() => setIsCreating(false)} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Behaviour History</h3>
          <p className="text-sm text-gray-500 mt-0.5">Timeline of all reported incidents and behaviour.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          Add Report
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-24 w-full" />
          <LoadingSkeleton className="h-24 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState 
          title="No behaviour reports" 
          description="This student has a clean record."
        />
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 mt-6">
          {reports.map((report) => (
            <div key={report.id} className="relative pl-8">
              {/* Timeline marker */}
              <span className={`absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-white flex items-center justify-center 
                ${report.severity === 'high' ? 'bg-red-500' : report.severity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} 
              />
              
              <div className="bg-white p-5 rounded-2xl border border-gray-200 transition-colors hover:border-gray-300">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h4 className="text-base font-semibold text-gray-900 tracking-tight">{report.title}</h4>
                      <StatusBadge status={report.category} variant="custom" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Reported by {report.reporter?.first_name} {report.reporter?.last_name} <span className="text-gray-400 font-normal">({report.reporter?.role.replace('_', ' ')})</span>
                    </p>
                  </div>
                  <div className="text-left md:text-right flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1.5">
                    <p className="text-sm text-gray-500 font-medium">
                      {new Date(report.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <StatusBadge status={report.status} variant="default" />
                  </div>
                </div>
                
                {report.comments && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    {report.comments}
                  </p>
                )}
                
                {report.evidence_url && (
                  <div className="mt-3">
                    <a 
                      href={report.evidence_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      View Attached Evidence
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
