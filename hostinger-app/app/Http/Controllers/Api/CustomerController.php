<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        $query = Customer::query()->orderBy('name');
        if ($search) {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('phone', 'like', $like)
                    ->orWhere('address', 'like', $like);
            });
        }

        return response()->json(['customers' => $query->get()->map(fn ($c) => $this->transform($c))]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $address = trim((string) $request->input('address', ''));
        $phone = trim((string) $request->input('phone', ''));
        $password = (string) $request->input('password', '');
        $houseNo = $request->input('houseNo') ? trim($request->input('houseNo')) ?: null : null;
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;

        if ($name === '') {
            return response()->json(['error' => 'Customer name is required.'], 400);
        }
        if ($address === '') {
            return response()->json(['error' => 'Address is required.'], 400);
        }
        if ($password !== '' && $phone === '') {
            return response()->json(['error' => 'A phone number is required to set a portal password.'], 400);
        }
        if ($phone !== '' && $this->isPhoneInUse($phone)) {
            return response()->json(['error' => 'This phone number is already used by another employee or customer account.'], 409);
        }

        $defaultRatePerBottle = null;
        if ($request->filled('defaultRatePerBottle')) {
            $v = (float) $request->input('defaultRatePerBottle');
            if ($v <= 0) {
                return response()->json(['error' => 'Default rate per bottle must be a positive number.'], 400);
            }
            $defaultRatePerBottle = $v;
        }

        $openingBalance = 0;
        if ($request->filled('openingBalance')) {
            $v = (float) $request->input('openingBalance');
            if ($v < 0) {
                return response()->json(['error' => 'Opening balance must be zero or more.'], 400);
            }
            $openingBalance = $v;
        }

        $customer = Customer::create([
            'name' => $name,
            'address' => $address,
            'phone' => $phone ?: null,
            'house_no' => $houseNo,
            'default_rate_per_bottle' => $defaultRatePerBottle,
            'opening_balance' => $openingBalance,
            'notes' => $notes,
            'password_hash' => $password !== '' ? Hash::make($password) : null,
        ]);

        return response()->json(['customer' => $this->transform($customer)], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        return response()->json(['customer' => $this->transform($customer), 'summary' => $this->summary($id)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        if ($request->has('name')) {
            $v = trim((string) $request->input('name'));
            if ($v === '') {
                return response()->json(['error' => 'Customer name cannot be empty.'], 400);
            }
            $customer->name = $v;
        }
        if ($request->has('address')) {
            $v = trim((string) $request->input('address'));
            if ($v === '') {
                return response()->json(['error' => 'Address cannot be empty.'], 400);
            }
            $customer->address = $v;
        }
        if ($request->has('phone')) {
            $v = $request->input('phone') ? trim($request->input('phone')) : null;
            if ($v && $this->isPhoneInUse($v, customerId: $id)) {
                return response()->json(['error' => 'This phone number is already used by another employee or customer account.'], 409);
            }
            $customer->phone = $v;
        }
        if ($request->has('houseNo')) {
            $customer->house_no = $request->input('houseNo') ? trim($request->input('houseNo')) ?: null : null;
        }
        if ($request->has('notes')) {
            $customer->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }
        if ($request->has('defaultRatePerBottle')) {
            $raw = $request->input('defaultRatePerBottle');
            if ($raw === '' || $raw === null) {
                $customer->default_rate_per_bottle = null;
            } else {
                $v = (float) $raw;
                if ($v <= 0) {
                    return response()->json(['error' => 'Default rate per bottle must be a positive number.'], 400);
                }
                $customer->default_rate_per_bottle = $v;
            }
        }
        if ($request->has('openingBalance')) {
            $v = (float) $request->input('openingBalance');
            if ($v < 0) {
                return response()->json(['error' => 'Opening balance must be zero or more.'], 400);
            }
            $customer->opening_balance = $v;
        }
        if ($request->filled('password')) {
            $phoneAfterUpdate = $request->has('phone') ? $customer->phone : $customer->phone;
            if (!$phoneAfterUpdate) {
                return response()->json(['error' => 'A phone number is required to set a portal password.'], 400);
            }
            $customer->password_hash = Hash::make((string) $request->input('password'));
        }

        $customer->save();

        return response()->json(['customer' => $this->transform($customer)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $orderCount = Order::where('customer_id', $id)->count();
        if ($orderCount > 0) {
            $plural = $orderCount > 1 ? 's' : '';
            return response()->json(['error' => "Can't delete this customer — they have {$orderCount} order{$plural} on record."], 409);
        }

        $customer->delete();

        return response()->json(['ok' => true]);
    }

    public function balance(int $id): JsonResponse
    {
        $customer = Customer::find($id);
        if (!$customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $orderRow = DB::table('orders')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN DATE(created_at) < CURDATE() THEN total_price ELSE 0 END), 0) AS prior_sales,
                COALESCE(SUM(CASE WHEN DATE(created_at) < CURDATE() AND payment_status != 'unpaid' THEN total_price ELSE 0 END), 0) AS prior_paid,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_price ELSE 0 END), 0) AS todays_sale,
                COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND payment_status != 'unpaid' THEN total_price ELSE 0 END), 0) AS todays_paid_via_order
            ")
            ->where('customer_id', $id)
            ->where('status', '!=', 'cancelled')
            ->first();

        $paymentRow = DB::table('payments_in')
            ->selectRaw("
                COALESCE(SUM(CASE WHEN payment_date < CURDATE() THEN amount ELSE 0 END), 0) AS prior_payments,
                COALESCE(SUM(CASE WHEN payment_date = CURDATE() THEN amount ELSE 0 END), 0) AS todays_payments
            ")
            ->where('customer_id', $id)
            ->first();

        $openingBalance = (float) $customer->opening_balance;
        $currentOutstanding = $openingBalance + (float) $orderRow->prior_sales - (float) $orderRow->prior_paid - (float) $paymentRow->prior_payments;
        $todaysSale = (float) $orderRow->todays_sale;
        $cashCollected = (float) $orderRow->todays_paid_via_order + (float) $paymentRow->todays_payments;

        return response()->json(['balance' => [
            'currentOutstanding' => $currentOutstanding,
            'todaysSale' => $todaysSale,
            'cashCollected' => $cashCollected,
            'newOutstanding' => $currentOutstanding + $todaysSale - $cashCollected,
        ]]);
    }

    public static function isPhoneInUse(string $phone, ?int $employeeId = null, ?int $customerId = null): bool
    {
        $employeeExists = \App\Models\Employee::where('phone', $phone)
            ->when($employeeId, fn ($q) => $q->where('id', '!=', $employeeId))
            ->exists();
        if ($employeeExists) {
            return true;
        }

        return Customer::where('phone', $phone)
            ->when($customerId, fn ($q) => $q->where('id', '!=', $customerId))
            ->exists();
    }

    public static function summary(int $customerId): array
    {
        $row = Order::where('customer_id', $customerId)
            ->selectRaw("
                COUNT(*) AS orderCount,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) AS totalSpent,
                MAX(created_at) AS lastOrderAt
            ")
            ->first();

        return [
            'orderCount' => (int) $row->orderCount,
            'totalSpent' => (float) $row->totalSpent,
            'lastOrderAt' => $row->lastOrderAt,
        ];
    }

    public static function transform(Customer $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'phone' => $c->phone,
            'address' => $c->address,
            'houseNo' => $c->house_no,
            'defaultRatePerBottle' => $c->default_rate_per_bottle !== null ? (float) $c->default_rate_per_bottle : null,
            'openingBalance' => (float) $c->opening_balance,
            'notes' => $c->notes,
            'createdAt' => $c->created_at,
            'updatedAt' => $c->updated_at,
        ];
    }
}
