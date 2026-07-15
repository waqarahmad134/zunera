// Expense types, category metadata and formatting helpers.

export type ExpenseCategory = "fuel" | "stock" | "salaries" | "maintenance" | "other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "fuel",
  "stock",
  "salaries",
  "maintenance",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: "Fuel",
  stock: "Bottles / Stock",
  salaries: "Salaries",
  maintenance: "Maintenance",
  other: "Other",
};

export interface Expense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  notes?: string | null;
}
