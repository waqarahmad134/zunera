<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffOrderController extends Controller
{
    private const STATUSES = ['pending', 'delivered', 'cancelled'];
    private const PAYMENT_STATUSES = ['unpaid', 'cash', 'online'];
    private const STATUS_LABELS = ['pending' => 'Pending', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];
    private const PAYMENT_STATUS_LABELS = ['unpaid' => 'Unpaid', 'cash' => 'Cash', 'online' => 'Online'];

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');

        if ($status && !in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status filter'], 400);
        }

        $query = Order::with(['customer', 'assignedEmployee'])->orderByDesc('created_at')->orderByDesc('id');
        if ($status) {
            $query->where('status', $status);
        }
        if ($search) {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->whereHas('customer', fn ($c) => $c->where('name', 'like', $like))
                    ->orWhere('address', 'like', $like);
            });
        }

        return response()->json(['orders' => $query->get()->map(fn ($o) => OrderController::transform($o))]);
    }

    // Employees may only change status/paymentStatus, each exactly once —
    // after that the matching *_locked_by_employee flag blocks any further
    // employee change to that field (only admin can adjust it after that).
    public function update(Request $request, int $id): JsonResponse
    {
        $session = $this->session($request);

        $hasStatus = $request->has('status');
        $hasPayment = $request->has('paymentStatus');

        if (!$hasStatus && !$hasPayment) {
            return response()->json(['error' => 'A status or payment status is required.'], 400);
        }
        if ($hasStatus && !in_array($request->input('status'), self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status.'], 400);
        }
        if ($hasPayment && !in_array($request->input('paymentStatus'), self::PAYMENT_STATUSES, true)) {
            return response()->json(['error' => 'Invalid payment status.'], 400);
        }

        $order = Order::with(['customer', 'assignedEmployee'])->find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if ($hasStatus && $order->status_locked_by_employee) {
            return response()->json(['error' => "This order's status was already updated once and is now locked. Ask an admin to change it further."], 403);
        }
        if ($hasPayment && $order->payment_locked_by_employee) {
            return response()->json(['error' => "This order's payment status was already updated once and is now locked. Ask an admin to change it further."], 403);
        }

        if ($hasStatus) {
            $order->status = $request->input('status');
            $order->status_locked_by_employee = true;
        }
        if ($hasPayment) {
            $order->payment_status = $request->input('paymentStatus');
            $order->payment_locked_by_employee = true;
        }
        $order->save();

        $employeeName = $session['name'] ?? 'An employee';
        $customerName = $order->customer?->name ?? 'customer';

        if ($hasStatus) {
            NotificationService::notify(
                'admin', null,
                'Order status updated',
                "{$employeeName} marked order #{$order->id} ({$customerName}) as " . self::STATUS_LABELS[$order->status] . '.',
                '/admin/orders'
            );
            NotificationService::notify(
                'customer', $order->customer_id,
                'Order status updated',
                "Your order #{$order->id} is now " . strtolower(self::STATUS_LABELS[$order->status]) . '.',
                '/portal'
            );
        }
        if ($hasPayment) {
            NotificationService::notify(
                'admin', null,
                'Payment updated',
                "{$employeeName} marked payment for order #{$order->id} ({$customerName}) as " . self::PAYMENT_STATUS_LABELS[$order->payment_status] . '.',
                '/admin/orders'
            );
            NotificationService::notify(
                'customer', $order->customer_id,
                'Payment updated',
                "Payment for order #{$order->id} is now marked as " . strtolower(self::PAYMENT_STATUS_LABELS[$order->payment_status]) . '.',
                '/portal'
            );
        }

        return response()->json(['order' => OrderController::transform($order)]);
    }
}
