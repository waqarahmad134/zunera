<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function subscribe(Request $request): JsonResponse
    {
        $session = $this->session($request);

        $endpoint = $request->input('endpoint');
        $p256dh = $request->input('keys.p256dh');
        $auth = $request->input('keys.auth');

        if (!is_string($endpoint) || !is_string($p256dh) || !is_string($auth)) {
            return response()->json(['error' => 'Invalid subscription.'], 400);
        }

        PushSubscription::updateOrCreate(
            ['endpoint' => $endpoint],
            [
                'for_role' => $session['role'],
                'for_id' => $session['id'] ?? null,
                'p256dh' => $p256dh,
                'auth' => $auth,
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $endpoint = $request->input('endpoint');
        if (is_string($endpoint)) {
            PushSubscription::where('endpoint', $endpoint)->delete();
        }

        return response()->json(['ok' => true]);
    }

    public function publicKey(): JsonResponse
    {
        return response()->json(['publicKey' => config('services.vapid.public_key')]);
    }
}
