<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Employee;
use App\Services\SessionToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $phone = trim((string) $request->input('phone', ''));
        $password = (string) $request->input('password', '');

        if ($password === '') {
            return response()->json(['error' => 'Password is required.'], 400);
        }

        if ($phone === '') {
            $adminPassword = env('ADMIN_PASSWORD') ?: (app()->environment('local') ? 'admin123' : null);
            if (!$adminPassword) {
                return response()->json(['error' => 'ADMIN_PASSWORD is not configured on the server.'], 500);
            }
            if (!hash_equals($adminPassword, $password)) {
                return response()->json(['error' => 'Incorrect password.'], 401);
            }

            $token = SessionToken::create('admin');
            return response()->json(['ok' => true, 'role' => 'admin', 'redirect' => '/admin', 'token' => $token]);
        }

        $employee = Employee::where('phone', $phone)->first();
        if ($employee && $employee->password_hash && $employee->status === 'active' && Hash::check($password, $employee->password_hash)) {
            $token = SessionToken::create('employee', $employee->id, $employee->name);
            return response()->json(['ok' => true, 'role' => 'employee', 'redirect' => '/staff', 'token' => $token]);
        }

        $customer = Customer::where('phone', $phone)->first();
        if ($customer && $customer->password_hash && Hash::check($password, $customer->password_hash)) {
            $token = SessionToken::create('customer', $customer->id, $customer->name);
            return response()->json(['ok' => true, 'role' => 'customer', 'redirect' => '/portal', 'token' => $token]);
        }

        return response()->json(['error' => 'Incorrect phone number or password.'], 401);
    }

    public function logout(): JsonResponse
    {
        // Stateless bearer tokens — nothing to revoke server-side, the SPA
        // just discards its stored token.
        return response()->json(['ok' => true]);
    }
}
