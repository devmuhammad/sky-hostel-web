"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/shared/components/ui/loading-button";

interface LogComment {
  id: string;
  comment: string;
  created_at: string;
  author?: {
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

function formatRole(role?: string) {
  if (!role) return "";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function LogComments({ logId }: { logId: string }) {
  const [comments, setComments] = useState<LogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-logs/${logId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.data || []);
    } catch (error) {
      console.error("Failed to load replies", error);
    } finally {
      setIsLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    setIsPosting(true);
    try {
      const res = await fetch(`/api/admin/daily-logs/${logId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: trimmed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setReply("");
      await fetchComments();
    } catch (error: any) {
      toast.error(error.message || "Failed to post reply");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="border-t pt-4">
      <h4 className="font-medium text-gray-900 mb-3">
        Discussion {comments.length > 0 && <span className="text-gray-400 font-normal">({comments.length})</span>}
      </h4>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading replies...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
          No replies yet. Start the conversation below.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {comment.author ? `${comment.author.first_name} ${comment.author.last_name}` : "Unknown"}
                  {comment.author?.role && (
                    <span className="ml-2 text-xs font-normal text-gray-500">{formatRole(comment.author.role)}</span>
                  )}
                </p>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(comment.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1.5">{comment.comment}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          rows={3}
          placeholder="Write a reply visible to the staff member and supervisors..."
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
        />
        <div className="flex justify-end">
          <LoadingButton
            onClick={handlePost}
            isLoading={isPosting}
            loadingText="Posting..."
            disabled={!reply.trim()}
            className="rounded-full px-6"
          >
            Post Reply
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
