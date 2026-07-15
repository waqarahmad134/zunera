<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// customerId comes strictly from the verified session — never from a
// client-supplied parameter — so one customer can never read another's
// data.
class PortalController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $session = $this->session($request);
        $customer = Customer::find($session['id']);
        if (!$customer) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $orders = Order::with(['customer', 'assignedEmployee'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'customer' => CustomerController::transform($customer),
            'summary' => CustomerController::summary($customer->id),
            'orders' => $orders->map(fn ($o) => OrderController::transform($o)),
        ]);
    }
}
