<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /** Aggregated counts and a zero-filled last-14-days series, for the dashboard. */
    public function index(): JsonResponse
    {
        $days = 14;

        $totals = DB::table('orders')->selectRaw("
            COUNT(*) AS orders,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
            SUM(CASE WHEN status != 'cancelled' THEN bottles ELSE 0 END) AS bottles,
            SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue
        ")->first();

        $from = Carbon::now()->subDays($days - 1)->startOfDay();
        $rows = DB::table('orders')
            ->selectRaw("
                DATE(created_at) AS day,
                COUNT(*) AS orders,
                SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue
            ")
            ->where('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->keyBy('day');

        $daily = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $key = Carbon::now()->subDays($i)->format('Y-m-d');
            $row = $rows->get($key);
            $daily[] = [
                'date' => $key,
                'orders' => $row ? (int) $row->orders : 0,
                'revenue' => $row ? (float) $row->revenue : 0,
            ];
        }

        return response()->json([
            'totals' => [
                'orders' => (int) ($totals->orders ?? 0),
                'pending' => (int) ($totals->pending ?? 0),
                'delivered' => (int) ($totals->delivered ?? 0),
                'cancelled' => (int) ($totals->cancelled ?? 0),
                'bottles' => (int) ($totals->bottles ?? 0),
                'revenue' => (float) ($totals->revenue ?? 0),
            ],
            'daily' => $daily,
        ]);
    }
}
