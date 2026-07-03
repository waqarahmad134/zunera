import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/api-cache";
import { createExpense, listExpenses } from "@/lib/db";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenses";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const search = req.nextUrl.searchParams.get("search");

  if (category && !EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
  }

  try {
    const expenses = await listExpenses({
      category: (category as ExpenseCategory) || undefined,
      search: search || undefined,
    });
    return cached(NextResponse.json({ expenses }), 20);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  const category = body?.category as ExpenseCategory;
  const amount = Number(body?.amount);
  const expenseDate = String(body?.expenseDate ?? "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!EXPENSE_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  try {
    const expense = await createExpense({ title, category, amount, expenseDate });
    return NextResponse.json({ expense }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create expense" },
      { status: 500 }
    );
  }
}
