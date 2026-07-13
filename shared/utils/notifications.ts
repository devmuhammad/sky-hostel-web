import { supabaseAdmin } from "@/shared/config/supabase";

export interface CreateNotificationInput {
  userId: string;
  type?: string;
  title: string;
  message?: string | null;
  link?: string | null;
  relatedId?: string | null;
}

/**
 * Insert one in-app notification. Failures are logged but never thrown so that
 * the primary action (e.g. posting a reply) is not blocked by notification issues.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: input.userId,
      type: input.type || "general",
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      related_id: input.relatedId ?? null,
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Fan out the same notification to a set of recipients, de-duplicated and with
 * any falsy ids removed.
 */
export async function notifyUsers(
  userIds: Array<string | null | undefined>,
  payload: Omit<CreateNotificationInput, "userId">
): Promise<void> {
  const uniqueIds = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  if (uniqueIds.length === 0) return;

  try {
    await supabaseAdmin.from("notifications").insert(
      uniqueIds.map((userId) => ({
        user_id: userId,
        type: payload.type || "general",
        title: payload.title,
        message: payload.message ?? null,
        link: payload.link ?? null,
        related_id: payload.relatedId ?? null,
      }))
    );
  } catch (error) {
    console.error("Failed to create notifications:", error);
  }
}
