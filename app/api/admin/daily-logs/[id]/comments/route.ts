import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/shared/config/auth";
import { supabaseAdmin } from "@/shared/config/supabase";
import { notifyUsers } from "@/shared/utils/notifications";

const SUPERVISOR_ROLES = ["super_admin", "admin", "hostel_manager"];
const STAFF_DAILY_LOG_ROLES = [
  ...SUPERVISOR_ROLES,
  "front_desk",
  "security",
  "accountant",
  "maintenance",
  "porter",
  "cleaner",
  "other",
];

async function loadLogAndAuthorize(logId: string, currentUser: { id: string; role: string }) {
  const { data: log, error } = await supabaseAdmin
    .from("staff_daily_logs")
    .select("id, staff_id, supervisor_id, duty_type")
    .eq("id", logId)
    .single();

  if (error || !log) return { log: null, allowed: false };

  const isSupervisor = SUPERVISOR_ROLES.includes(currentUser.role);
  const allowed = isSupervisor || log.staff_id === currentUser.id;
  return { log, allowed };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole(STAFF_DAILY_LOG_ROLES);

    const { log, allowed } = await loadLogAndAuthorize(id, currentUser);
    if (!log || !allowed) {
      return NextResponse.json(
        { success: false, error: "Log not found or access denied" },
        { status: 404 }
      );
    }

    const { data: comments, error } = await supabaseAdmin
      .from("staff_daily_log_comments")
      .select(`
        *,
        author:admin_users!staff_daily_log_comments_author_id_fkey(first_name, last_name, role)
      `)
      .eq("log_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: comments || [] });
  } catch (error) {
    console.error("Fetch log comments error:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized or failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireRole(STAFF_DAILY_LOG_ROLES);

    const { log, allowed } = await loadLogAndAuthorize(id, currentUser);
    if (!log || !allowed) {
      return NextResponse.json(
        { success: false, error: "Log not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const comment = String(body.comment || "").trim();

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment text is required" },
        { status: 400 }
      );
    }

    const { data: created, error } = await supabaseAdmin
      .from("staff_daily_log_comments")
      .insert({
        log_id: id,
        author_id: currentUser.id,
        comment,
      })
      .select(`
        *,
        author:admin_users!staff_daily_log_comments_author_id_fkey(first_name, last_name, role)
      `)
      .single();

    if (error) throw error;

    // Notify every participant (log owner, its supervisor, and prior repliers)
    // except the person who just replied.
    const { data: priorComments } = await supabaseAdmin
      .from("staff_daily_log_comments")
      .select("author_id")
      .eq("log_id", id);

    const recipientIds = [
      log.staff_id,
      log.supervisor_id,
      ...(priorComments || []).map((c) => c.author_id),
    ].filter((recipientId) => recipientId && recipientId !== currentUser.id);

    const authorName = `${currentUser.first_name} ${currentUser.last_name}`.trim();

    await notifyUsers(recipientIds, {
      type: "daily_log_reply",
      title: "New reply on a daily log",
      message: `${authorName} replied on the "${log.duty_type}" daily log.`,
      link: "/admin/daily-logs",
      relatedId: id,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Create log comment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post reply" },
      { status: 500 }
    );
  }
}
