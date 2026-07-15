<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

// Fires an in-app notification and best-effort Web Push for one recipient.
// for_role/for_id scope the recipient the same way as the D1 schema:
// role='admin' (id null) reaches every admin session; role in
// ('employee','customer') with an id reaches that one user only.
class NotificationService
{
    public static function notify(string $forRole, ?int $forId, string $title, string $body, ?string $url = null): void
    {
        AppNotification::create([
            'for_role' => $forRole,
            'for_id' => $forId,
            'title' => $title,
            'body' => $body,
            'url' => $url,
        ]);

        $subscriptions = PushSubscription::where('for_role', $forRole)
            ->where('for_id', $forId)
            ->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = self::client();
        if (!$webPush) {
            return;
        }

        $payload = json_encode(['title' => $title, 'body' => $body, 'url' => $url]);

        foreach ($subscriptions as $sub) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->p256dh,
                    'authToken' => $sub->auth,
                ]),
                $payload
            );
        }

        foreach ($webPush->flush() as $report) {
            if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
            // Best-effort: a broken push shouldn't fail the request that triggered it.
        }
    }

    private static function client(): ?WebPush
    {
        $publicKey = config('services.vapid.public_key');
        $privateKey = config('services.vapid.private_key');
        if (!$publicKey || !$privateKey) {
            return null;
        }

        try {
            return new WebPush([
                'VAPID' => [
                    'subject' => 'mailto:admin@jubilee-water.local',
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);
        } catch (Throwable) {
            return null;
        }
    }
}
