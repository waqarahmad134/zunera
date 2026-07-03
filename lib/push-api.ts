// Shared subscribe/unsubscribe handlers for Web Push, reused by the
// /api/admin, /api/staff and /api/portal push routes.
import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "./current-session";
import { deletePushSubscription, savePushSubscription, type NotificationRecipient } from "./db";

export async function handlePushSubscribe(req: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const recipient: NotificationRecipient = { role: session.role, id: session.id ?? null };
  await savePushSubscription(recipient, { endpoint, p256dh, auth });
  return NextResponse.json({ ok: true });
}

export async function handlePushUnsubscribe(req: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.endpoint === "string") {
    await deletePushSubscription(body.endpoint);
  }
  return NextResponse.json({ ok: true });
}
