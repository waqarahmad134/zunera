<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(): JsonResponse
    {
        $purchases = Purchase::with(['supplier', 'purchaseItems.item'])
            ->orderByDesc('received_date')
            ->orderByDesc('id')
            ->get();

        return response()->json(['purchases' => $purchases->map(fn ($p) => $this->transform($p))]);
    }

    public function store(Request $request): JsonResponse
    {
        $supplierId = (int) $request->input('supplierId');
        $receivedDate = trim((string) $request->input('receivedDate', ''));
        $receiptNo = $request->input('receiptNo') ? trim($request->input('receiptNo')) ?: null : null;
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        $rawLines = $request->input('lines');
        $rawLines = is_array($rawLines) ? $rawLines : [];

        if ($supplierId <= 0) {
            return response()->json(['error' => 'Select a supplier for this purchase.'], 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $receivedDate)) {
            return response()->json(['error' => 'A valid received date is required.'], 400);
        }
        if (count($rawLines) === 0) {
            return response()->json(['error' => 'Add at least one item line.'], 400);
        }

        $supplier = Supplier::find($supplierId);
        if (!$supplier) {
            return response()->json(['error' => 'That supplier no longer exists.'], 400);
        }

        $lines = [];
        foreach ($rawLines as $raw) {
            $itemId = (int) ($raw['itemId'] ?? 0);
            $qty = $raw['qty'] ?? null;
            $unitCost = $raw['unitCost'] ?? null;

            if ($itemId <= 0) {
                return response()->json(['error' => 'Every line needs an item selected.'], 400);
            }
            if (!is_numeric($qty) || (float) $qty <= 0 || (int) $qty != $qty) {
                return response()->json(['error' => 'Quantity must be a positive whole number.'], 400);
            }
            if (!is_numeric($unitCost) || (float) $unitCost < 0) {
                return response()->json(['error' => 'Unit cost must be zero or more.'], 400);
            }
            if (!Item::where('id', $itemId)->exists()) {
                return response()->json(['error' => 'One of the selected items no longer exists.'], 400);
            }
            $lines[] = ['itemId' => $itemId, 'qty' => (int) $qty, 'unitCost' => (float) $unitCost];
        }

        $purchase = DB::transaction(function () use ($supplierId, $receiptNo, $receivedDate, $notes, $lines) {
            $totalCost = array_sum(array_map(fn ($l) => $l['qty'] * $l['unitCost'], $lines));

            $purchase = Purchase::create([
                'supplier_id' => $supplierId,
                'receipt_no' => $receiptNo,
                'received_date' => $receivedDate,
                'notes' => $notes,
                'total_cost' => $totalCost,
            ]);

            foreach ($lines as $line) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'item_id' => $line['itemId'],
                    'qty' => $line['qty'],
                    'unit_cost' => $line['unitCost'],
                    'line_total' => $line['qty'] * $line['unitCost'],
                ]);
            }

            return $purchase;
        });

        $purchase->load(['supplier', 'purchaseItems.item']);

        return response()->json(['purchase' => $this->transform($purchase)], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::transaction(function () use ($id) {
            PurchaseItem::where('purchase_id', $id)->delete();
            Purchase::where('id', $id)->delete();
        });

        return response()->json(['ok' => true]);
    }

    /** Suggests the next GRN-YYYYMMDD-NNN, based on today's date and how many purchases already exist for today. */
    public function nextReceiptNo(): JsonResponse
    {
        $datePart = now()->format('Ymd');
        $prefix = "GRN-{$datePart}-";
        $count = Purchase::where('receipt_no', 'like', "{$prefix}%")->count();
        $next = str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);

        return response()->json(['receiptNo' => "{$prefix}{$next}"]);
    }

    private function transform(Purchase $p): array
    {
        return [
            'id' => $p->id,
            'supplierId' => $p->supplier_id,
            'supplierName' => $p->supplier?->name,
            'receiptNo' => $p->receipt_no,
            'receivedDate' => $p->received_date instanceof \DateTimeInterface ? $p->received_date->format('Y-m-d') : $p->received_date,
            'notes' => $p->notes,
            'totalCost' => (float) $p->total_cost,
            'lines' => $p->purchaseItems->map(fn (PurchaseItem $l) => [
                'id' => $l->id,
                'itemId' => $l->item_id,
                'itemName' => $l->item?->name,
                'qty' => $l->qty,
                'unitCost' => (float) $l->unit_cost,
                'lineTotal' => (float) $l->line_total,
            ]),
            'createdAt' => $p->created_at,
            'updatedAt' => $p->updated_at,
        ];
    }
}
