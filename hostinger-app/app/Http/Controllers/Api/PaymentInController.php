<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\PaymentIn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentInController extends Controller
{
    private const METHODS = ['cash', 'bank'];

    public function index(Request $request): JsonResponse
    {
        $customerId = $request->query('customerId');
        $from = $request->query('from');
        $to = $request->query('to');

        if ($customerId !== null && (!ctype_digit((string) $customerId) || (int) $customerId <= 0)) {
            return response()->json(['error' => 'Invalid customerId filter'], 400);
        }

        $query = PaymentIn::with('customer')->orderByDesc('payment_date')->orderByDesc('id');
        if ($customerId) {
            $query->where('customer_id', (int) $customerId);
        }
        if ($from) {
            $query->where('payment_date', '>=', $from);
        }
        if ($to) {
            $query->where('payment_date', '<=', $to);
        }

        return response()->json(['payments' => $query->get()->map(fn ($p) => $this->transform($p))]);
    }

    public function store(Request $request): JsonResponse
    {
        $customerId = (int) $request->input('customerId');
        $amount = $request->input('amount');
        $paymentDate = trim((string) $request->input('paymentDate', ''));
        $method = $request->input('method') ?: 'cash';
        $note = $request->input('note') ? trim($request->input('note')) ?: null : null;

        if ($customerId <= 0) {
            return response()->json(['error' => 'Select a customer for this payment.'], 400);
        }
        if (!is_numeric($amount) || (float) $amount <= 0) {
            return response()->json(['error' => 'Amount must be a positive number.'], 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $paymentDate)) {
            return response()->json(['error' => 'A valid date is required.'], 400);
        }
        if (!in_array($method, self::METHODS, true)) {
            return response()->json(['error' => 'Invalid payment method.'], 400);
        }

        $customer = Customer::find($customerId);
        if (!$customer) {
            return response()->json(['error' => 'That customer no longer exists.'], 400);
        }

        $payment = PaymentIn::create([
            'customer_id' => $customerId,
            'amount' => (float) $amount,
            'payment_date' => $paymentDate,
            'method' => $method,
            'note' => $note,
        ]);
        $payment->load('customer');

        return response()->json(['payment' => $this->transform($payment)], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        PaymentIn::where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function transform(PaymentIn $p): array
    {
        return [
            'id' => $p->id,
            'customerId' => $p->customer_id,
            'customerName' => $p->customer?->name,
            'amount' => (float) $p->amount,
            'paymentDate' => $p->payment_date instanceof \DateTimeInterface ? $p->payment_date->format('Y-m-d') : $p->payment_date,
            'method' => $p->method,
            'note' => $p->note,
            'createdAt' => $p->created_at,
            'updatedAt' => $p->updated_at,
        ];
    }
}
