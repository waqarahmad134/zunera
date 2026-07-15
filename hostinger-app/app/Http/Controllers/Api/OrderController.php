<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    private const STATUSES = ['pending', 'delivered', 'cancelled'];
    private const PAYMENT_STATUSES = ['unpaid', 'cash', 'online'];
    private const STATUS_LABELS = ['pending' => 'Pending', 'delivered' => 'Delivered', 'cancelled' => 'Cancelled'];
    private const PAYMENT_STATUS_LABELS = ['unpaid' => 'Unpaid', 'cash' => 'Cash', 'online' => 'Online'];

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');
        $customerId = $request->query('customerId');

        if ($status && !in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status filter'], 400);
        }
        if ($customerId !== null && (!ctype_digit((string) $customerId) || (int) $customerId <= 0)) {
            return response()->json(['error' => 'Invalid customerId filter'], 400);
        }

        $orders = $this->query($status, $search, $customerId ? (int) $customerId : null)->get();

        return response()->json(['orders' => $orders->map(fn ($o) => static::transform($o))]);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['customer', 'assignedEmployee'])->find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json(['order' => static::transform($order)]);
    }

    public function store(Request $request): JsonResponse
    {
        $customerId = (int) $request->input('customerId');
        $address = trim((string) $request->input('address', ''));
        $bottles = $request->input('bottles');
        $ratePerBottle = $request->input('ratePerBottle');
        $status = $request->input('status') ?: 'pending';
        $paymentStatus = $request->input('paymentStatus') ?: 'unpaid';
        $assignedEmployeeIdRaw = $request->input('assignedEmployeeId');
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;

        if ($customerId <= 0) {
            return response()->json(['error' => 'Select a customer for this order.'], 400);
        }
        if ($address === '') {
            return response()->json(['error' => 'Delivery address is required.'], 400);
        }
        if (!is_numeric($bottles) || (float) $bottles <= 0 || (int) $bottles != $bottles) {
            return response()->json(['error' => 'Number of bottles must be a positive whole number.'], 400);
        }
        if (!is_numeric($ratePerBottle) || (float) $ratePerBottle <= 0) {
            return response()->json(['error' => 'Rate per bottle must be a positive number.'], 400);
        }
        if (!in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status.'], 400);
        }
        if (!in_array($paymentStatus, self::PAYMENT_STATUSES, true)) {
            return response()->json(['error' => 'Invalid payment status.'], 400);
        }

        $assignedEmployeeId = null;
        if ($assignedEmployeeIdRaw) {
            $v = (int) $assignedEmployeeIdRaw;
            if ($v <= 0 || !Employee::where('id', $v)->exists()) {
                return response()->json(['error' => 'Invalid assigned employee.'], 400);
            }
            $assignedEmployeeId = $v;
        }

        $customer = Customer::find($customerId);
        if (!$customer) {
            return response()->json(['error' => 'That customer no longer exists.'], 400);
        }

        $bottlesInt = (int) $bottles;
        $order = Order::create([
            'customer_id' => $customerId,
            'address' => $address,
            'bottles' => $bottlesInt,
            'rate_per_bottle' => (float) $ratePerBottle,
            'total_price' => $bottlesInt * (float) $ratePerBottle,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'assigned_employee_id' => $assignedEmployeeId,
            'notes' => $notes,
        ]);

        if ($assignedEmployeeId) {
            $plural = $bottlesInt > 1 ? 's' : '';
            NotificationService::notify(
                'employee', $assignedEmployeeId,
                'New order assigned',
                "Order #{$order->id} for {$customer->name} — {$bottlesInt} bottle{$plural}.",
                '/staff'
            );
        }

        $order->load(['customer', 'assignedEmployee']);

        return response()->json(['order' => static::transform($order)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['customer', 'assignedEmployee'])->find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $beforeStatus = $order->status;
        $beforePaymentStatus = $order->payment_status;
        $beforeAssignedEmployeeId = $order->assigned_employee_id;

        if ($request->has('customerId')) {
            $v = (int) $request->input('customerId');
            if ($v <= 0 || !Customer::where('id', $v)->exists()) {
                return response()->json(['error' => 'That customer no longer exists.'], 400);
            }
            $order->customer_id = $v;
        }
        if ($request->has('address')) {
            $v = trim((string) $request->input('address'));
            if ($v === '') {
                return response()->json(['error' => 'Address cannot be empty.'], 400);
            }
            $order->address = $v;
        }
        if ($request->has('bottles')) {
            $v = $request->input('bottles');
            if (!is_numeric($v) || (float) $v <= 0 || (int) $v != $v) {
                return response()->json(['error' => 'Number of bottles must be a positive whole number.'], 400);
            }
            $order->bottles = (int) $v;
        }
        if ($request->has('ratePerBottle')) {
            $v = $request->input('ratePerBottle');
            if (!is_numeric($v) || (float) $v <= 0) {
                return response()->json(['error' => 'Rate per bottle must be a positive number.'], 400);
            }
            $order->rate_per_bottle = (float) $v;
        }
        if ($request->has('status')) {
            if (!in_array($request->input('status'), self::STATUSES, true)) {
                return response()->json(['error' => 'Invalid status.'], 400);
            }
            $order->status = $request->input('status');
        }
        if ($request->has('paymentStatus')) {
            if (!in_array($request->input('paymentStatus'), self::PAYMENT_STATUSES, true)) {
                return response()->json(['error' => 'Invalid payment status.'], 400);
            }
            $order->payment_status = $request->input('paymentStatus');
        }
        $assignedEmployeeIdSet = false;
        if ($request->has('assignedEmployeeId')) {
            $raw = $request->input('assignedEmployeeId');
            if ($raw === null || $raw === '') {
                $order->assigned_employee_id = null;
            } else {
                $v = (int) $raw;
                if ($v <= 0 || !Employee::where('id', $v)->exists()) {
                    return response()->json(['error' => 'Invalid assigned employee.'], 400);
                }
                $order->assigned_employee_id = $v;
            }
            $assignedEmployeeIdSet = true;
        }
        if ($request->has('notes')) {
            $order->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }

        $order->total_price = $order->bottles * $order->rate_per_bottle;
        $order->save();
        $order->load(['customer', 'assignedEmployee']);

        if ($assignedEmployeeIdSet && $order->assigned_employee_id !== null && $order->assigned_employee_id !== $beforeAssignedEmployeeId) {
            $plural = $order->bottles > 1 ? 's' : '';
            NotificationService::notify(
                'employee', $order->assigned_employee_id,
                'New order assigned',
                "Order #{$order->id} for {$order->customer->name} — {$order->bottles} bottle{$plural}.",
                '/staff'
            );
        }
        if ($request->has('status') && $order->status !== $beforeStatus) {
            NotificationService::notify(
                'customer', $order->customer_id,
                'Order status updated',
                "Your order #{$order->id} is now " . strtolower(self::STATUS_LABELS[$order->status]) . '.',
                '/portal'
            );
        }
        if ($request->has('paymentStatus') && $order->payment_status !== $beforePaymentStatus) {
            NotificationService::notify(
                'customer', $order->customer_id,
                'Payment updated',
                "Payment for order #{$order->id} is now marked as " . strtolower(self::PAYMENT_STATUS_LABELS[$order->payment_status]) . '.',
                '/portal'
            );
        }

        return response()->json(['order' => static::transform($order)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        $order->delete();

        return response()->json(['ok' => true]);
    }

    private function query(?string $status, ?string $search, ?int $customerId)
    {
        $query = Order::with(['customer', 'assignedEmployee'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

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
        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        return $query;
    }

    public static function transform(Order $o): array
    {
        return [
            'id' => $o->id,
            'customerId' => $o->customer_id,
            'customerName' => $o->customer?->name,
            'address' => $o->address,
            'bottles' => $o->bottles,
            'ratePerBottle' => (float) $o->rate_per_bottle,
            'totalPrice' => (float) $o->total_price,
            'status' => $o->status,
            'paymentStatus' => $o->payment_status,
            'assignedEmployeeId' => $o->assigned_employee_id,
            'assignedEmployeeName' => $o->assignedEmployee?->name,
            'statusLockedByEmployee' => (bool) $o->status_locked_by_employee,
            'paymentLockedByEmployee' => (bool) $o->payment_locked_by_employee,
            'notes' => $o->notes,
            'createdAt' => $o->created_at,
            'updatedAt' => $o->updated_at,
        ];
    }
}
