<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class EmployeeController extends Controller
{
    private const STATUSES = ['active', 'inactive'];

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = $request->query('search');

        if ($status && !in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status filter'], 400);
        }

        $query = Employee::query()->orderBy('name');
        if ($status) {
            $query->where('status', $status);
        }
        if ($search) {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)->orWhere('role', 'like', $like)->orWhere('phone', 'like', $like);
            });
        }

        return response()->json(['employees' => $query->get()->map(fn ($e) => $this->transform($e))]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $phone = trim((string) $request->input('phone', ''));
        $role = trim((string) $request->input('role', ''));
        $salary = $request->input('salary');
        $joinedDate = trim((string) $request->input('joinedDate', ''));
        $status = $request->input('status') ?: 'active';
        $password = (string) $request->input('password', '');
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;

        if ($name === '') {
            return response()->json(['error' => 'Name is required.'], 400);
        }
        if ($role === '') {
            return response()->json(['error' => 'Role is required.'], 400);
        }
        if (!is_numeric($salary) || (float) $salary <= 0) {
            return response()->json(['error' => 'Salary must be a positive number.'], 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $joinedDate)) {
            return response()->json(['error' => 'A valid joining date is required.'], 400);
        }
        if (!in_array($status, self::STATUSES, true)) {
            return response()->json(['error' => 'Invalid status.'], 400);
        }
        if ($password !== '' && $phone === '') {
            return response()->json(['error' => 'A phone number is required to set a staff login password.'], 400);
        }
        if ($phone !== '' && CustomerController::isPhoneInUse($phone)) {
            return response()->json(['error' => 'This phone number is already used by another employee or customer account.'], 409);
        }

        $employee = Employee::create([
            'name' => $name,
            'phone' => $phone ?: null,
            'role' => $role,
            'salary' => (float) $salary,
            'joined_date' => $joinedDate,
            'status' => $status,
            'notes' => $notes,
            'password_hash' => $password !== '' ? Hash::make($password) : null,
        ]);

        return response()->json(['employee' => $this->transform($employee)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        if ($request->has('name')) {
            $v = trim((string) $request->input('name'));
            if ($v === '') {
                return response()->json(['error' => 'Name cannot be empty.'], 400);
            }
            $employee->name = $v;
        }
        if ($request->has('phone')) {
            $v = $request->input('phone') ? trim($request->input('phone')) : null;
            if ($v && CustomerController::isPhoneInUse($v, employeeId: $id)) {
                return response()->json(['error' => 'This phone number is already used by another employee or customer account.'], 409);
            }
            $employee->phone = $v;
        }
        if ($request->has('role')) {
            $v = trim((string) $request->input('role'));
            if ($v === '') {
                return response()->json(['error' => 'Role cannot be empty.'], 400);
            }
            $employee->role = $v;
        }
        if ($request->has('salary')) {
            $v = $request->input('salary');
            if (!is_numeric($v) || (float) $v <= 0) {
                return response()->json(['error' => 'Salary must be a positive number.'], 400);
            }
            $employee->salary = (float) $v;
        }
        if ($request->has('joinedDate')) {
            $v = trim((string) $request->input('joinedDate'));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
                return response()->json(['error' => 'A valid joining date is required.'], 400);
            }
            $employee->joined_date = $v;
        }
        if ($request->has('status')) {
            if (!in_array($request->input('status'), self::STATUSES, true)) {
                return response()->json(['error' => 'Invalid status.'], 400);
            }
            $employee->status = $request->input('status');
        }
        if ($request->has('notes')) {
            $employee->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }
        if ($request->filled('password')) {
            if (!$employee->phone) {
                return response()->json(['error' => 'A phone number is required to set a staff login password.'], 400);
            }
            $employee->password_hash = Hash::make((string) $request->input('password'));
        }

        $employee->save();

        return response()->json(['employee' => $this->transform($employee)]);
    }

    public function destroy(int $id): JsonResponse
    {
        $employee = Employee::find($id);
        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        $employee->delete();

        return response()->json(['ok' => true]);
    }

    private function transform(Employee $e): array
    {
        return [
            'id' => $e->id,
            'name' => $e->name,
            'phone' => $e->phone,
            'role' => $e->role,
            'salary' => (float) $e->salary,
            'joinedDate' => $e->joined_date instanceof \DateTimeInterface ? $e->joined_date->format('Y-m-d') : $e->joined_date,
            'status' => $e->status,
            'notes' => $e->notes,
            'createdAt' => $e->created_at,
            'updatedAt' => $e->updated_at,
        ];
    }
}
