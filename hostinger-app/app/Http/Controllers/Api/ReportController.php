<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private const DATE_RE = '/^\d{4}-\d{2}-\d{2}$/';

    public function index(Request $request): JsonResponse
    {
        $from = $request->query('from');
        $to = $request->query('to');

        if (!$to || !preg_match(self::DATE_RE, $to) || ($from && !preg_match(self::DATE_RE, $from))) {
            return response()->json(['error' => 'to (and optionally from) must be YYYY-MM-DD.'], 400);
        }
        if ($from && $from > $to) {
            return response()->json(['error' => 'from must be before to.'], 400);
        }

        $resolvedFrom = $from;
        if (!$resolvedFrom) {
            $earliest = DB::table(DB::raw('(
                SELECT DATE(created_at) AS d FROM orders
                UNION ALL
                SELECT expense_date AS d FROM expenses
            ) AS combined'))->min('d');
            $resolvedFrom = $earliest ?? $to;
        }
        $floor = Carbon::parse($to)->subYears(5)->format('Y-m-d');
        if ($resolvedFrom < $floor) {
            $resolvedFrom = $floor;
        }
        $from = $resolvedFrom;

        $rangeDays = Carbon::parse($from)->diffInDays(Carbon::parse($to)) + 1;
        $granularity = $rangeDays <= 60 ? 'day' : 'month';

        $orderBucketExpr = $granularity === 'day' ? 'DATE(created_at)' : "DATE_FORMAT(created_at, '%Y-%m-01')";
        $expenseBucketExpr = $granularity === 'day' ? 'expense_date' : "DATE_FORMAT(expense_date, '%Y-%m-01')";

        $totalsRow = DB::table('orders')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) AS revenue,
                COUNT(CASE WHEN status != 'cancelled' THEN 1 END) AS orderCount
            ")
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->first();

        $expenseTotalRow = DB::table('expenses')
            ->selectRaw('COALESCE(SUM(amount), 0) AS total')
            ->whereBetween('expense_date', [$from, $to])
            ->first();

        $revByBucket = DB::table('orders')
            ->selectRaw("{$orderBucketExpr} AS bucket, SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue")
            ->whereBetween(DB::raw('DATE(created_at)'), [$from, $to])
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $expByBucket = DB::table('expenses')
            ->selectRaw("{$expenseBucketExpr} AS bucket, SUM(amount) AS total")
            ->whereBetween('expense_date', [$from, $to])
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        $series = [];
        foreach ($this->bucketKeys($from, $to, $granularity) as $key) {
            $series[] = [
                'date' => $key,
                'revenue' => $revByBucket->has($key) ? (float) $revByBucket->get($key)->revenue : 0,
                'expenses' => $expByBucket->has($key) ? (float) $expByBucket->get($key)->total : 0,
            ];
        }

        $revenue = (float) ($totalsRow->revenue ?? 0);
        $expensesTotal = (float) ($expenseTotalRow->total ?? 0);

        return response()->json([
            'from' => $from,
            'to' => $to,
            'granularity' => $granularity,
            'totals' => [
                'revenue' => $revenue,
                'expensesTotal' => $expensesTotal,
                'profit' => $revenue - $expensesTotal,
                'orderCount' => (int) ($totalsRow->orderCount ?? 0),
            ],
            'series' => $series,
        ]);
    }

    private function bucketKeys(string $from, string $to, string $granularity): array
    {
        $keys = [];
        $start = Carbon::parse($from);
        $end = Carbon::parse($to);

        if ($granularity === 'day') {
            $d = $start->copy();
            while ($d->lte($end)) {
                $keys[] = $d->format('Y-m-d');
                $d->addDay();
            }
        } else {
            $d = Carbon::create($start->year, $start->month, 1);
            $endMonth = Carbon::create($end->year, $end->month, 1);
            while ($d->lte($endMonth)) {
                $keys[] = $d->format('Y-m-d');
                $d->addMonth();
            }
        }

        return $keys;
    }
}
