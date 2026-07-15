<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        $query = Supplier::query()->orderBy('name');
        if ($search) {
            $like = "%{$search}%";
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)->orWhere('phone', 'like', $like)->orWhere('address', 'like', $like);
            });
        }

        return response()->json(['suppliers' => $query->get()->map(fn ($s) => $this->transform($s))]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $phone = trim((string) $request->input('phone', ''));
        $address = trim((string) $request->input('address', ''));
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;

        if ($name === '') {
            return response()->json(['error' => 'Supplier name is required.'], 400);
        }

        $openingBalance = 0;
        if ($request->filled('openingBalance')) {
            $v = (float) $request->input('openingBalance');
            if ($v < 0) {
                return response()->json(['error' => 'Opening balance must be zero or more.'], 400);
            }
            $openingBalance = $v;
        }

        $supplier = Supplier::create([
            'name' => $name,
            'phone' => $phone ?: null,
            'address' => $address ?: null,
            'opening_balance' => $openingBalance,
            'notes' => $notes,
        ]);

        return response()->json(['supplier' => $this->transform($supplier)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $supplier = Supplier::find($id);
        if (!$supplier) {
            return response()->json(['error' => 'Supplier not found'], 404);
        }

        if ($request->has('name')) {
            $v = trim((string) $request->input('name'));
            if ($v === '') {
                return response()->json(['error' => 'Supplier name cannot be empty.'], 400);
            }
            $supplier->name = $v;
        }
        if ($request->has('phone')) {
            $supplier->phone = $request->input('phone') ? trim($request->input('phone')) : null;
        }
        if ($request->has('address')) {
            $supplier->address = $request->input('address') ? trim($request->input('address')) : null;
        }
        if ($request->has('openingBalance')) {
            $v = (float) $request->input('openingBalance');
            if ($v < 0) {
                return response()->json(['error' => 'Opening balance must be zero or more.'], 400);
            }
            $supplier->opening_balance = $v;
        }
        if ($request->has('notes')) {
            $supplier->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }

        $supplier->save();

        return response()->json(['supplier' => $this->transform($supplier)]);
    }

    public function destroy(int $id): JsonResponse
    {
        Supplier::where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function transform(Supplier $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'phone' => $s->phone,
            'address' => $s->address,
            'openingBalance' => (float) $s->opening_balance,
            'notes' => $s->notes,
            'createdAt' => $s->created_at,
            'updatedAt' => $s->updated_at,
        ];
    }
}
