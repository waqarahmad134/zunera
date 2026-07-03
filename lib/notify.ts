// Fires an in-app notification and best-effort Web Push for one recipient.
// Used from the order routes whenever an order is assigned to an employee
// or an employee updates an order's status (which notifies admin).
import "server-only";
import {
  createNotification,
  deletePushSubscription,
  listPushSubscriptions,
  type NotificationRecipient,
} from "./db";
import { PushGoneError, sendWebPush } from "./webpush";

export async function notify(
  recipient: NotificationRecipient,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  await createNotification(recipient, title, body, url);

  const subs = await listPushSubscriptions(recipient);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await sendWebPush(sub, { title, body, url });
      } catch (e) {
        if (e instanceof PushGoneError) {
          await deletePushSubscription(sub.endpoint);
        }
        // Best-effort: a broken push shouldn't fail the request that triggered it.
      }
    })
  );
}
