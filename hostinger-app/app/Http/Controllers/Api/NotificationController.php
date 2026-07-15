<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $session = $this->session($request);

        $notifications = AppNotification::where('for_role', $session['role'])
            ->where('for_id', $session['id'] ?? null)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(30)
            ->get()
            ->map(fn (AppNotification $n) => $this->transform($n));

        $unread = AppNotification::where('for_role', $session['role'])
            ->where('for_id', $session['id'] ?? null)
            ->whereNull('read_at')
            ->count();

        return response()->json(['notifications' => $notifications, 'unread' => $unread]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $session = $this->session($request);

        AppNotification::where('for_role', $session['role'])
            ->where('for_id', $session['id'] ?? null)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    private function transform(AppNotification $n): array
    {
        return [
            'id' => $n->id,
            'title' => $n->title,
            'body' => $n->body,
            'url' => $n->url,
            'read' => $n->read_at !== null,
            'createdAt' => $n->created_at,
        ];
    }
}
