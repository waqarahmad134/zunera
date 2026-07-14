import { NextRequest, NextResponse } from "next/server";
import { deleteExpense, updateExpense } from "@/lib/db";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expenses";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const update: {
    title?: string;
    category?: ExpenseCategory;
    amount?: number;
    expenseDate?: string;
    notes?: string | null;
  } = {};

  if (body.title !== undefined) {
    const v = String(body.title).trim();
    if (!v) return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    update.title = v;
  }
  if (body.category !== undefined) {
    if (!EXPENSE_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    update.category = body.category;
  }
  if (body.amount !== undefined) {
    const v = Number(body.amount);
    if (!Number.isFinite(v) || v <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    update.amount = v;
  }
  if (body.expenseDate !== undefined) {
    const v = String(body.expenseDate).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
    }
    update.expenseDate = v;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes ? String(body.notes).trim() || null : null;
  }

  try {
    const expense = await updateExpense(id, update);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = parseId((await params).id);
  if (id === null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  try {
    await deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not delete expense" },
      { status: 500 }
    );
  }
}
