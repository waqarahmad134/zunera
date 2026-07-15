<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    private const CATEGORIES = ['fuel', 'stock', 'salaries', 'maintenance', 'other'];

    public function index(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $search = $request->query('search');

        if ($category && !in_array($category, self::CATEGORIES, true)) {
            return response()->json(['error' => 'Invalid category filter'], 400);
        }

        $query = Expense::query()->orderByDesc('expense_date')->orderByDesc('id');
        if ($category) {
            $query->where('category', $category);
        }
        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        return response()->json(['expenses' => $query->get()->map(fn ($e) => $this->transform($e))]);
    }

    public function store(Request $request): JsonResponse
    {
        $title = trim((string) $request->input('title', ''));
        $category = $request->input('category');
        $amount = $request->input('amount');
        $expenseDate = trim((string) $request->input('expenseDate', ''));
        $notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;

        if ($title === '') {
            return response()->json(['error' => 'Title is required.'], 400);
        }
        if (!in_array($category, self::CATEGORIES, true)) {
            return response()->json(['error' => 'Invalid category.'], 400);
        }
        if (!is_numeric($amount) || (float) $amount <= 0) {
            return response()->json(['error' => 'Amount must be a positive number.'], 400);
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $expenseDate)) {
            return response()->json(['error' => 'A valid date is required.'], 400);
        }

        $expense = Expense::create([
            'title' => $title,
            'category' => $category,
            'amount' => (float) $amount,
            'expense_date' => $expenseDate,
            'notes' => $notes,
        ]);

        return response()->json(['expense' => $this->transform($expense)], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $expense = Expense::find($id);
        if (!$expense) {
            return response()->json(['error' => 'Expense not found'], 404);
        }

        if ($request->has('title')) {
            $v = trim((string) $request->input('title'));
            if ($v === '') {
                return response()->json(['error' => 'Title cannot be empty.'], 400);
            }
            $expense->title = $v;
        }
        if ($request->has('category')) {
            if (!in_array($request->input('category'), self::CATEGORIES, true)) {
                return response()->json(['error' => 'Invalid category.'], 400);
            }
            $expense->category = $request->input('category');
        }
        if ($request->has('amount')) {
            $v = $request->input('amount');
            if (!is_numeric($v) || (float) $v <= 0) {
                return response()->json(['error' => 'Amount must be a positive number.'], 400);
            }
            $expense->amount = (float) $v;
        }
        if ($request->has('expenseDate')) {
            $v = trim((string) $request->input('expenseDate'));
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
                return response()->json(['error' => 'A valid date is required.'], 400);
            }
            $expense->expense_date = $v;
        }
        if ($request->has('notes')) {
            $expense->notes = $request->input('notes') ? trim($request->input('notes')) ?: null : null;
        }

        $expense->save();

        return response()->json(['expense' => $this->transform($expense)]);
    }

    public function destroy(int $id): JsonResponse
    {
        Expense::where('id', $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function transform(Expense $e): array
    {
        return [
            'id' => $e->id,
            'title' => $e->title,
            'category' => $e->category,
            'amount' => (float) $e->amount,
            'expenseDate' => $e->expense_date instanceof \DateTimeInterface ? $e->expense_date->format('Y-m-d') : $e->expense_date,
            'notes' => $e->notes,
            'createdAt' => $e->created_at,
            'updatedAt' => $e->updated_at,
        ];
    }
}
