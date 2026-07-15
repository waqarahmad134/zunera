<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        $query = Item::query()->orderBy('name');
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        return response()->json(['items' => $query->get()->map(fn ($i) => $this->transform($i))]);
    }

    public function store(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        $returnable = (bool) $request->input('returnable', false);

        if ($name === '') {
            return response()->json(['error' => 'Item name is required.'], 400);
        }

        $cost = $request->filled('cost') ? $request->input('cost') : 0;
        if (!is_numeric($cost) || (float) $cost < 0) {
            return response()->json(['error' => 'Cost must be zero or more.'], 400);
        }

        $margin = $request->filled('margin') ? $request->input('margin') : 0;
        if (!is_numeric($margin) || (float) $margin < 0) {
            return response()->json(['error' => 'Margin must be zero or more.'], 400);
        }

        $openingStock = $request->filled('openingStock') ? $request->input('openingStock') : 0;
        if (!is_numeric($openingStock) || (int) $openingStock != $openingStock || (int) $openingStock < 0) {
            return response()->json(['error' => 'Opening stock must be a whole number, zero or more.'], 400);
        }

        $item = Item::create([
            'name' => $name,
            'cost' => (float) $cost,
            'margin' => (float) $margin,
            'returnable' => $returnable,
            'opening_stock' => (int) $openingStock,
            'notes' => $notes,
        ]);

        return response()->json(['item' => $this->transform($item)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = Item::find($id);
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($request->has('name')) {
            $v = trim((string) $request->input('name'));
            if ($v === '') {
                return response()->json(['error' => 'Item name cannot be empty.'], 400);
            }
            $item->name = $v;
        }
        if ($request->has('cost')) {
            $v = $request->input('cost');
            if (!is_numeric($v) || (float) $v < 0) {
                return response()->json(['error' => 'Cost must be zero or more.'], 400);
            }
            $item->cost = (float) $v;
        }
        if ($request->has('margin')) {
            $v = $request->input('margin');
            if (!is_numeric($v) || (float) $v < 0) {
                return response()->json(['error' => 'Margin must be zero or more.'], 400);
            }
            $item->margin = (float) $v;
        }
        if ($request->has('returnable')) {
            $item->returnable = (bool) $request->input('returnable');
        }
        if ($request->has('openingStock')) {
            $v = $request->input('openingStock');
            if (!is_numeric($v) || (int) $v != $v || (int) $v < 0) {
                return response()->json(['error' => 'Opening stock must be a whole number, zero or more.'], 400);
            }
            $item->opening_stock = (int) $v;
        }
        if ($request->has('notes')) {
            $item->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }

        $item->save();

        return response()->json(['item' => $this->transform($item->fresh())]);
    }

    public function destroy(int $id): JsonResponse
    {
        Item::where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function transform(Item $i): array
    {
        return [
            'id' => $i->id,
            'name' => $i->name,
            'cost' => (float) $i->cost,
            'margin' => (float) $i->margin,
            'salePrice' => (float) $i->cost + (float) $i->margin,
            'returnable' => (bool) $i->returnable,
            'openingStock' => $i->opening_stock,
            'currentStock' => $i->current_stock,
            'notes' => $i->notes,
            'createdAt' => $i->created_at,
            'updatedAt' => $i->updated_at,
        ];
    }
}
