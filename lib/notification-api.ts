// Shared GET/POST handlers for the notification inbox, reused by the
// /api/admin, /api/staff and /api/portal notification routes — recipient
// scoping comes entirely from the verified session, never from the client.
import "server-only";
import { NextResponse } from "next/server";
import { cached } from "./api-cache";
import { getCurrentSession } from "./current-session";
import { listNotifications, markNotificationsRead, unreadNotificationCount, type NotificationRecipient } from "./db";

export async function handleNotificationsGet(): Promise<NextResponse> {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipient: NotificationRecipient = { role: session.role, id: session.id ?? null };
  const [notifications, unread] = await Promise.all([
    listNotifications(recipient),
    unreadNotificationCount(recipient),
  ]);
  return cached(NextResponse.json({ notifications, unread }), 5);
}

export async function handleNotificationsMarkRead(): Promise<NextResponse> {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipient: NotificationRecipient = { role: session.role, id: session.id ?? null };
  await markNotificationsRead(recipient);
  return NextResponse.json({ ok: true });
}
