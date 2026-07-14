// D1 data-access layer.
import "server-only";
import { getEnv } from "./cf";
import type { NewOrderInput, Order, OrderStatus, PaymentStatus } from "./orders";
import type { Customer, CustomerSummary, NewCustomerInput } from "./customers";
import type { Expense, ExpenseCategory, NewExpenseInput } from "./expenses";
import type { Employee, EmployeeStatus, NewEmployeeInput } from "./employees";
import type { Notification } from "./notifications";
import type { EmployeeLocation } from "./locations";
import type { Role } from "./session";
import type { Supplier, NewSupplierInput } from "./suppliers";
import type { Item, NewItemInput } from "./items";
import type { NewPurchaseInput, Purchase, PurchaseLine } from "./purchases";
import type { CustomerBalance } from "./customers";
import type { NewPaymentInInput, PaymentIn, PaymentMethod } from "./payments";

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

interface OrderRow {
  id: number;
  customer_id: number;
  customer_name: string;
  address: string;
  bottles: number;
  rate_per_bottle: number;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  assigned_employee_id: number | null;
  assigned_employee_name: string | null;
  status_locked_by_employee: number;
  payment_locked_by_employee: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    address: r.address,
    bottles: r.bottles,
    ratePerBottle: r.rate_per_bottle,
    totalPrice: r.total_price,
    status: r.status,
    paymentStatus: r.payment_status,
    assignedEmployeeId: r.assigned_employee_id,
    assignedEmployeeName: r.assigned_employee_name,
    statusLockedByEmployee: !!r.status_locked_by_employee,
    paymentLockedByEmployee: !!r.payment_locked_by_employee,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const ORDER_SELECT = `
  SELECT o.id, o.customer_id, c.name AS customer_name, o.address, o.bottles,
         o.rate_per_bottle, o.total_price, o.status, o.payment_status,
         o.assigned_employee_id, e.name AS assigned_employee_name,
         o.status_locked_by_employee, o.payment_locked_by_employee, o.notes,
         o.created_at, o.updated_at
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  LEFT JOIN employees e ON e.id = o.assigned_employee_id
`;

export interface OrderFilters {
  status?: OrderStatus;
  /** Matches against customer name or address (case-insensitive substring). */
  search?: string;
  customerId?: number;
  assignedEmployeeId?: number;
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const env = await getEnv();
  const clauses: string[] = [];
  const binds: unknown[] = [];

  if (filters.status) {
    clauses.push("o.status = ?");
    binds.push(filters.status);
  }
  if (filters.search) {
    clauses.push("(c.name LIKE ? OR o.address LIKE ?)");
    const like = `%${filters.search}%`;
    binds.push(like, like);
  }
  if (filters.customerId) {
    clauses.push("o.customer_id = ?");
    binds.push(filters.customerId);
  }
  if (filters.assignedEmployeeId) {
    clauses.push("o.assigned_employee_id = ?");
    binds.push(filters.assignedEmployeeId);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const stmt = env.DB.prepare(
    `${ORDER_SELECT} ${where} ORDER BY o.created_at DESC, o.id DESC`
  );
  const { results } = await stmt.bind(...binds).all<OrderRow>();
  return (results ?? []).map(toOrder);
}

export async function getOrder(id: number): Promise<Order | null> {
  const env = await getEnv();
  const row = await env.DB.prepare(`${ORDER_SELECT} WHERE o.id = ?1`)
    .bind(id)
    .first<OrderRow>();
  return row ? toOrder(row) : null;
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const env = await getEnv();
  const total = input.bottles * input.ratePerBottle;
  const inserted = await env.DB.prepare(
    `INSERT INTO orders (customer_id, address, bottles, rate_per_bottle, total_price, status, payment_status, assigned_employee_id, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
     RETURNING id`
  )
    .bind(
      input.customerId,
      input.address,
      input.bottles,
      input.ratePerBottle,
      total,
      input.status,
      input.paymentStatus ?? "unpaid",
      input.assignedEmployeeId ?? null,
      input.notes ?? null
    )
    .first<{ id: number }>();
  return (await getOrder(inserted!.id))!;
}

export interface OrderUpdateInput {
  customerId?: number;
  address?: string;
  bottles?: number;
  ratePerBottle?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** undefined = leave unchanged, null = unassign, number = assign to that employee. */
  assignedEmployeeId?: number | null;
  /** Set true when an employee (not admin) is the one making this status/payment change. */
  statusLockedByEmployee?: boolean;
  paymentLockedByEmployee?: boolean;
  notes?: string | null;
}

export async function updateOrder(
  id: number,
  input: OrderUpdateInput
): Promise<Order | null> {
  const env = await getEnv();
  const existing = await getOrder(id);
  if (!existing) return null;

  const bottles = input.bottles ?? existing.bottles;
  const rate = input.ratePerBottle ?? existing.ratePerBottle;
  const total = bottles * rate;

  await env.DB.prepare(
    `UPDATE orders SET
       customer_id = ?1,
       address = ?2,
       bottles = ?3,
       rate_per_bottle = ?4,
       total_price = ?5,
       status = ?6,
       payment_status = ?7,
       assigned_employee_id = ?8,
       status_locked_by_employee = ?9,
       payment_locked_by_employee = ?10,
       notes = ?11,
       updated_at = datetime('now')
     WHERE id = ?12`
  )
    .bind(
      input.customerId ?? existing.customerId,
      input.address ?? existing.address,
      bottles,
      rate,
      total,
      input.status ?? existing.status,
      input.paymentStatus ?? existing.paymentStatus,
      input.assignedEmployeeId !== undefined ? input.assignedEmployeeId : existing.assignedEmployeeId,
      (input.statusLockedByEmployee ?? existing.statusLockedByEmployee) ? 1 : 0,
      (input.paymentLockedByEmployee ?? existing.paymentLockedByEmployee) ? 1 : 0,
      input.notes !== undefined ? input.notes : existing.notes,
      id
    )
    .run();
  return getOrder(id);
}

export async function deleteOrder(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM orders WHERE id = ?1").bind(id).run();
}

export interface DashboardStats {
  totals: {
    orders: number;
    pending: number;
    delivered: number;
    cancelled: number;
    bottles: number;
    revenue: number;
  };
  daily: { date: string; orders: number; revenue: number }[];
}

/** Aggregated counts and a zero-filled last-14-days series, for the dashboard. */
export async function getDashboardStats(days = 14): Promise<DashboardStats> {
  const env = await getEnv();

  const totalsRow = await env.DB.prepare(
    `SELECT
       COUNT(*) AS orders,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,
       SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status != 'cancelled' THEN bottles ELSE 0 END) AS bottles,
       SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue
     FROM orders`
  ).first<{
    orders: number;
    pending: number | null;
    delivered: number | null;
    cancelled: number | null;
    bottles: number | null;
    revenue: number | null;
  }>();

  const { results } = await env.DB.prepare(
    `SELECT
       date(created_at) AS day,
       COUNT(*) AS orders,
       SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue
     FROM orders
     WHERE created_at >= datetime('now', ?1)
     GROUP BY day
     ORDER BY day ASC`
  )
    .bind(`-${days - 1} days`)
    .all<{ day: string; orders: number; revenue: number }>();

  const byDay = new Map((results ?? []).map((r) => [r.day, r]));

  const daily: DashboardStats["daily"] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = byDay.get(key);
    daily.push({ date: key, orders: row?.orders ?? 0, revenue: row?.revenue ?? 0 });
  }

  return {
    totals: {
      orders: totalsRow?.orders ?? 0,
      pending: totalsRow?.pending ?? 0,
      delivered: totalsRow?.delivered ?? 0,
      cancelled: totalsRow?.cancelled ?? 0,
      bottles: totalsRow?.bottles ?? 0,
      revenue: totalsRow?.revenue ?? 0,
    },
    daily,
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

interface CustomerRow {
  id: number;
  name: string;
  phone: string | null;
  address: string;
  house_no: string | null;
  default_rate_per_bottle: number | null;
  opening_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    houseNo: r.house_no,
    defaultRatePerBottle: r.default_rate_per_bottle,
    openingBalance: r.opening_balance,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listCustomers(search?: string): Promise<Customer[]> {
  const env = await getEnv();
  if (search) {
    const like = `%${search}%`;
    const { results } = await env.DB.prepare(
      `SELECT * FROM customers WHERE name LIKE ?1 OR phone LIKE ?1 OR address LIKE ?1 ORDER BY name ASC`
    )
      .bind(like)
      .all<CustomerRow>();
    return (results ?? []).map(toCustomer);
  }
  const { results } = await env.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all<CustomerRow>();
  return (results ?? []).map(toCustomer);
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT * FROM customers WHERE id = ?1").bind(id).first<CustomerRow>();
  return row ? toCustomer(row) : null;
}

export async function createCustomer(
  input: NewCustomerInput,
  passwordHash: string | null = null
): Promise<Customer> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `INSERT INTO customers (name, phone, address, house_no, default_rate_per_bottle, opening_balance, notes, password_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING *`
  )
    .bind(
      input.name,
      input.phone || null,
      input.address,
      input.houseNo ?? null,
      input.defaultRatePerBottle ?? null,
      input.openingBalance ?? 0,
      input.notes ?? null,
      passwordHash
    )
    .first<CustomerRow>();
  return toCustomer(row!);
}

export interface CustomerUpdateInput {
  name?: string;
  phone?: string | null;
  address?: string;
  houseNo?: string | null;
  defaultRatePerBottle?: number | null;
  openingBalance?: number;
  notes?: string | null;
  /** undefined = leave unchanged, null = clear, string = set to this hash. */
  passwordHash?: string | null;
}

export async function updateCustomer(
  id: number,
  input: CustomerUpdateInput
): Promise<Customer | null> {
  const env = await getEnv();
  const existing = await getCustomer(id);
  if (!existing) return null;

  let passwordHash: string | null;
  if (input.passwordHash !== undefined) {
    passwordHash = input.passwordHash;
  } else {
    const row = await env.DB.prepare("SELECT password_hash FROM customers WHERE id = ?1")
      .bind(id)
      .first<{ password_hash: string | null }>();
    passwordHash = row?.password_hash ?? null;
  }

  const row = await env.DB.prepare(
    `UPDATE customers SET name = ?1, phone = ?2, address = ?3, house_no = ?4,
       default_rate_per_bottle = ?5, opening_balance = ?6, notes = ?7, password_hash = ?8,
       updated_at = datetime('now')
     WHERE id = ?9 RETURNING *`
  )
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone || null : existing.phone,
      input.address ?? existing.address,
      input.houseNo !== undefined ? input.houseNo : existing.houseNo,
      input.defaultRatePerBottle !== undefined ? input.defaultRatePerBottle : existing.defaultRatePerBottle,
      input.openingBalance ?? existing.openingBalance,
      input.notes !== undefined ? input.notes : existing.notes,
      passwordHash,
      id
    )
    .first<CustomerRow>();
  return row ? toCustomer(row) : null;
}

/** Auth lookup only — includes the password hash, unlike toCustomer(). */
export async function getCustomerByPhone(
  phone: string
): Promise<{ id: number; name: string; passwordHash: string | null } | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT id, name, password_hash FROM customers WHERE phone = ?1")
    .bind(phone)
    .first<{ id: number; name: string; password_hash: string | null }>();
  return row ? { id: row.id, name: row.name, passwordHash: row.password_hash } : null;
}

/** Throws if the customer has orders — callers should catch and surface a 409. */
export async function deleteCustomer(id: number): Promise<void> {
  const env = await getEnv();
  const { count } = (await env.DB.prepare("SELECT COUNT(*) AS count FROM orders WHERE customer_id = ?1")
    .bind(id)
    .first<{ count: number }>())!;
  if (count > 0) {
    throw new Error(
      `Can't delete this customer — they have ${count} order${count > 1 ? "s" : ""} on record.`
    );
  }
  await env.DB.prepare("DELETE FROM customers WHERE id = ?1").bind(id).run();
}

export async function getCustomerSummary(id: number): Promise<CustomerSummary> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `SELECT
       COUNT(*) AS orderCount,
       COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) AS totalSpent,
       MAX(created_at) AS lastOrderAt
     FROM orders WHERE customer_id = ?1`
  )
    .bind(id)
    .first<{ orderCount: number; totalSpent: number; lastOrderAt: string | null }>();
  return {
    orderCount: row?.orderCount ?? 0,
    totalSpent: row?.totalSpent ?? 0,
    lastOrderAt: row?.lastOrderAt ?? null,
  };
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

interface ExpenseRow {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    amount: r.amount,
    expenseDate: r.expense_date,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  search?: string;
}

export async function listExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
  const env = await getEnv();
  const clauses: string[] = [];
  const binds: unknown[] = [];

  if (filters.category) {
    clauses.push("category = ?");
    binds.push(filters.category);
  }
  if (filters.search) {
    clauses.push("title LIKE ?");
    binds.push(`%${filters.search}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await env.DB.prepare(
    `SELECT * FROM expenses ${where} ORDER BY expense_date DESC, id DESC`
  )
    .bind(...binds)
    .all<ExpenseRow>();
  return (results ?? []).map(toExpense);
}

export async function getExpense(id: number): Promise<Expense | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT * FROM expenses WHERE id = ?1").bind(id).first<ExpenseRow>();
  return row ? toExpense(row) : null;
}

export async function createExpense(input: NewExpenseInput): Promise<Expense> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `INSERT INTO expenses (title, category, amount, expense_date, notes) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *`
  )
    .bind(input.title, input.category, input.amount, input.expenseDate, input.notes ?? null)
    .first<ExpenseRow>();
  return toExpense(row!);
}

export interface ExpenseUpdateInput {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  expenseDate?: string;
  notes?: string | null;
}

export async function updateExpense(
  id: number,
  input: ExpenseUpdateInput
): Promise<Expense | null> {
  const env = await getEnv();
  const existing = await getExpense(id);
  if (!existing) return null;

  const row = await env.DB.prepare(
    `UPDATE expenses SET title = ?1, category = ?2, amount = ?3, expense_date = ?4, notes = ?5, updated_at = datetime('now')
     WHERE id = ?6 RETURNING *`
  )
    .bind(
      input.title ?? existing.title,
      input.category ?? existing.category,
      input.amount ?? existing.amount,
      input.expenseDate ?? existing.expenseDate,
      input.notes !== undefined ? input.notes : existing.notes,
      id
    )
    .first<ExpenseRow>();
  return row ? toExpense(row) : null;
}

export async function deleteExpense(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM expenses WHERE id = ?1").bind(id).run();
}

// ---------------------------------------------------------------------------
// Reports — revenue vs expenses / profit over a date range.
// ---------------------------------------------------------------------------

export interface ReportPoint {
  /** Bucket start date, YYYY-MM-DD (day or first-of-month depending on granularity). */
  date: string;
  revenue: number;
  expenses: number;
}

export interface ReportData {
  from: string;
  to: string;
  granularity: "day" | "month";
  totals: {
    revenue: number;
    expensesTotal: number;
    profit: number;
    orderCount: number;
  };
  series: ReportPoint[];
}

function bucketKeysInRange(from: string, to: string, granularity: "day" | "month"): string[] {
  const keys: string[] = [];
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");

  if (granularity === "day") {
    const d = new Date(start);
    while (d <= end) {
      keys.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
  } else {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    while (d <= endMonth) {
      keys.push(d.toISOString().slice(0, 10));
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
  }
  return keys;
}

/**
 * `from` may be null for an "all time" report — resolved to the earliest
 * order or expense on record (clamped to at most 5 years back), so a fresh
 * business never generates years of empty zero-filled buckets.
 */
export async function getReport(from: string | null, to: string): Promise<ReportData> {
  const env = await getEnv();

  let resolvedFrom = from;
  if (!resolvedFrom) {
    const earliest = await env.DB.prepare(
      `SELECT MIN(d) AS earliest FROM (
         SELECT date(created_at) AS d FROM orders
         UNION ALL
         SELECT expense_date AS d FROM expenses
       )`
    ).first<{ earliest: string | null }>();
    resolvedFrom = earliest?.earliest ?? to;
  }
  const fiveYearsBeforeTo = new Date(to + "T00:00:00Z");
  fiveYearsBeforeTo.setUTCFullYear(fiveYearsBeforeTo.getUTCFullYear() - 5);
  const floor = fiveYearsBeforeTo.toISOString().slice(0, 10);
  if (resolvedFrom < floor) resolvedFrom = floor;
  from = resolvedFrom;

  const rangeDays =
    Math.round((new Date(to + "T00:00:00Z").getTime() - new Date(from + "T00:00:00Z").getTime()) / 86400000) + 1;
  const granularity: "day" | "month" = rangeDays <= 60 ? "day" : "month";

  const orderBucketExpr = granularity === "day" ? "date(created_at)" : "strftime('%Y-%m-01', created_at)";
  const expenseBucketExpr = granularity === "day" ? "expense_date" : "strftime('%Y-%m-01', expense_date)";

  const [totalsRow, expenseTotalRow, revByBucket, expByBucket] = await Promise.all([
    env.DB.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END), 0) AS revenue,
         COUNT(CASE WHEN status != 'cancelled' THEN 1 END) AS orderCount
       FROM orders WHERE date(created_at) BETWEEN ?1 AND ?2`
    )
      .bind(from, to)
      .first<{ revenue: number; orderCount: number }>(),
    env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE expense_date BETWEEN ?1 AND ?2`)
      .bind(from, to)
      .first<{ total: number }>(),
    env.DB.prepare(
      `SELECT ${orderBucketExpr} AS bucket, SUM(CASE WHEN status != 'cancelled' THEN total_price ELSE 0 END) AS revenue
       FROM orders WHERE date(created_at) BETWEEN ?1 AND ?2 GROUP BY bucket`
    )
      .bind(from, to)
      .all<{ bucket: string; revenue: number }>(),
    env.DB.prepare(
      `SELECT ${expenseBucketExpr} AS bucket, SUM(amount) AS total
       FROM expenses WHERE expense_date BETWEEN ?1 AND ?2 GROUP BY bucket`
    )
      .bind(from, to)
      .all<{ bucket: string; total: number }>(),
  ]);

  const revMap = new Map((revByBucket.results ?? []).map((r) => [r.bucket, r.revenue]));
  const expMap = new Map((expByBucket.results ?? []).map((r) => [r.bucket, r.total]));

  const series: ReportPoint[] = bucketKeysInRange(from, to, granularity).map((date) => ({
    date,
    revenue: revMap.get(date) ?? 0,
    expenses: expMap.get(date) ?? 0,
  }));

  const revenue = totalsRow?.revenue ?? 0;
  const expensesTotal = expenseTotalRow?.total ?? 0;

  return {
    from,
    to,
    granularity,
    totals: {
      revenue,
      expensesTotal,
      profit: revenue - expensesTotal,
      orderCount: totalsRow?.orderCount ?? 0,
    },
    series,
  };
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

interface EmployeeRow {
  id: number;
  name: string;
  phone: string | null;
  role: string;
  salary: number;
  joined_date: string;
  status: EmployeeStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toEmployee(r: EmployeeRow): Employee {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    role: r.role,
    salary: r.salary,
    joinedDate: r.joined_date,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface EmployeeFilters {
  status?: EmployeeStatus;
  search?: string;
}

export async function listEmployees(filters: EmployeeFilters = {}): Promise<Employee[]> {
  const env = await getEnv();
  const clauses: string[] = [];
  const binds: unknown[] = [];

  if (filters.status) {
    clauses.push("status = ?");
    binds.push(filters.status);
  }
  if (filters.search) {
    clauses.push("(name LIKE ? OR role LIKE ? OR phone LIKE ?)");
    const like = `%${filters.search}%`;
    binds.push(like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await env.DB.prepare(
    `SELECT * FROM employees ${where} ORDER BY name ASC`
  )
    .bind(...binds)
    .all<EmployeeRow>();
  return (results ?? []).map(toEmployee);
}

export async function getEmployee(id: number): Promise<Employee | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT * FROM employees WHERE id = ?1").bind(id).first<EmployeeRow>();
  return row ? toEmployee(row) : null;
}

export async function createEmployee(
  input: NewEmployeeInput,
  passwordHash: string | null = null
): Promise<Employee> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `INSERT INTO employees (name, phone, role, salary, joined_date, status, notes, password_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING *`
  )
    .bind(
      input.name,
      input.phone || null,
      input.role,
      input.salary,
      input.joinedDate,
      input.status,
      input.notes ?? null,
      passwordHash
    )
    .first<EmployeeRow>();
  return toEmployee(row!);
}

export interface EmployeeUpdateInput {
  name?: string;
  phone?: string | null;
  role?: string;
  salary?: number;
  joinedDate?: string;
  status?: EmployeeStatus;
  notes?: string | null;
  /** undefined = leave unchanged, null = clear, string = set to this hash. */
  passwordHash?: string | null;
}

export async function updateEmployee(
  id: number,
  input: EmployeeUpdateInput
): Promise<Employee | null> {
  const env = await getEnv();
  const existing = await getEmployee(id);
  if (!existing) return null;

  let passwordHash: string | null;
  if (input.passwordHash !== undefined) {
    passwordHash = input.passwordHash;
  } else {
    const row = await env.DB.prepare("SELECT password_hash FROM employees WHERE id = ?1")
      .bind(id)
      .first<{ password_hash: string | null }>();
    passwordHash = row?.password_hash ?? null;
  }

  const row = await env.DB.prepare(
    `UPDATE employees SET
       name = ?1, phone = ?2, role = ?3, salary = ?4, joined_date = ?5, status = ?6,
       notes = ?7, password_hash = ?8, updated_at = datetime('now')
     WHERE id = ?9 RETURNING *`
  )
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone || null : existing.phone,
      input.role ?? existing.role,
      input.salary ?? existing.salary,
      input.joinedDate ?? existing.joinedDate,
      input.status ?? existing.status,
      input.notes !== undefined ? input.notes : existing.notes,
      passwordHash,
      id
    )
    .first<EmployeeRow>();
  return row ? toEmployee(row) : null;
}

export async function deleteEmployee(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM employees WHERE id = ?1").bind(id).run();
}

/** Auth lookup only — includes the password hash, unlike toEmployee(). */
export async function getEmployeeByPhone(
  phone: string
): Promise<{ id: number; name: string; status: EmployeeStatus; passwordHash: string | null } | null> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    "SELECT id, name, status, password_hash FROM employees WHERE phone = ?1"
  )
    .bind(phone)
    .first<{ id: number; name: string; status: EmployeeStatus; password_hash: string | null }>();
  return row ? { id: row.id, name: row.name, status: row.status, passwordHash: row.password_hash } : null;
}

/**
 * True if `phone` already belongs to a different employee or customer.
 * Phone is the login identifier for both roles and the login lookup checks
 * employees before customers, so a collision silently locks out whichever
 * record loses (it can never be reached, or logs in as the other account if
 * passwords happen to match) — this must be rejected before it happens,
 * not discovered afterwards.
 */
export async function isPhoneInUse(
  phone: string,
  exclude: { employeeId?: number; customerId?: number } = {}
): Promise<boolean> {
  const env = await getEnv();
  const empRow = await env.DB.prepare("SELECT id FROM employees WHERE phone = ?1 AND id != ?2 LIMIT 1")
    .bind(phone, exclude.employeeId ?? -1)
    .first<{ id: number }>();
  if (empRow) return true;

  const custRow = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?1 AND id != ?2 LIMIT 1")
    .bind(phone, exclude.customerId ?? -1)
    .first<{ id: number }>();
  return !!custRow;
}

// ---------------------------------------------------------------------------
// Notifications — in-app + backing store for Web Push subscriptions.
// `for_role` + `for_id` scope the recipient: role='admin' (id NULL) reaches
// every admin session; role in ('employee','customer') with an id reaches
// that one user only.
// ---------------------------------------------------------------------------

export interface NotificationRecipient {
  role: Role;
  id?: number | null;
}

interface NotificationRow {
  id: number;
  title: string;
  body: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

function toNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    url: r.url,
    read: r.read_at !== null,
    createdAt: r.created_at,
  };
}

export async function createNotification(
  recipient: NotificationRecipient,
  title: string,
  body: string,
  url?: string
): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare(
    `INSERT INTO notifications (for_role, for_id, title, body, url) VALUES (?1, ?2, ?3, ?4, ?5)`
  )
    .bind(recipient.role, recipient.id ?? null, title, body, url ?? null)
    .run();
}

export async function listNotifications(recipient: NotificationRecipient, limit = 30): Promise<Notification[]> {
  const env = await getEnv();
  const { results } = await env.DB.prepare(
    `SELECT * FROM notifications WHERE for_role = ?1 AND (for_id IS ?2)
     ORDER BY created_at DESC, id DESC LIMIT ?3`
  )
    .bind(recipient.role, recipient.id ?? null, limit)
    .all<NotificationRow>();
  return (results ?? []).map(toNotification);
}

export async function unreadNotificationCount(recipient: NotificationRecipient): Promise<number> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM notifications WHERE for_role = ?1 AND (for_id IS ?2) AND read_at IS NULL`
  )
    .bind(recipient.role, recipient.id ?? null)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function markNotificationsRead(recipient: NotificationRecipient): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare(
    `UPDATE notifications SET read_at = datetime('now') WHERE for_role = ?1 AND (for_id IS ?2) AND read_at IS NULL`
  )
    .bind(recipient.role, recipient.id ?? null)
    .run();
}

// ---------------------------------------------------------------------------
// Push subscriptions
// ---------------------------------------------------------------------------

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function savePushSubscription(
  recipient: NotificationRecipient,
  sub: PushSubscriptionRecord
): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (for_role, for_id, endpoint, p256dh, auth) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(endpoint) DO UPDATE SET
       for_role = excluded.for_role, for_id = excluded.for_id,
       p256dh = excluded.p256dh, auth = excluded.auth`
  )
    .bind(recipient.role, recipient.id ?? null, sub.endpoint, sub.p256dh, sub.auth)
    .run();
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?1").bind(endpoint).run();
}

export async function listPushSubscriptions(recipient: NotificationRecipient): Promise<PushSubscriptionRecord[]> {
  const env = await getEnv();
  const { results } = await env.DB.prepare(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE for_role = ?1 AND (for_id IS ?2)`
  )
    .bind(recipient.role, recipient.id ?? null)
    .all<PushSubscriptionRecord>();
  return results ?? [];
}

// ---------------------------------------------------------------------------
// Employee live location — one row per employee, upserted on every ping.
// ---------------------------------------------------------------------------

export async function saveEmployeeLocation(
  employeeId: number,
  lat: number,
  lng: number,
  accuracy: number | null
): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare(
    `INSERT INTO employee_locations (employee_id, lat, lng, accuracy, updated_at)
     VALUES (?1, ?2, ?3, ?4, datetime('now'))
     ON CONFLICT(employee_id) DO UPDATE SET
       lat = excluded.lat, lng = excluded.lng, accuracy = excluded.accuracy, updated_at = excluded.updated_at`
  )
    .bind(employeeId, lat, lng, accuracy)
    .run();
}

/** Only active employees who have shared a location at least once. */
export async function listEmployeeLocations(): Promise<EmployeeLocation[]> {
  const env = await getEnv();
  const { results } = await env.DB.prepare(
    `SELECT l.employee_id, e.name AS employee_name, e.role AS employee_role, e.phone AS employee_phone,
            l.lat, l.lng, l.accuracy, l.updated_at
     FROM employee_locations l
     JOIN employees e ON e.id = l.employee_id
     WHERE e.status = 'active'
     ORDER BY l.updated_at DESC`
  ).all<{
    employee_id: number;
    employee_name: string;
    employee_role: string;
    employee_phone: string | null;
    lat: number;
    lng: number;
    accuracy: number | null;
    updated_at: string;
  }>();
  return (results ?? []).map((r) => ({
    employeeId: r.employee_id,
    employeeName: r.employee_name,
    employeeRole: r.employee_role,
    employeePhone: r.employee_phone,
    lat: r.lat,
    lng: r.lng,
    accuracy: r.accuracy,
    updatedAt: r.updated_at,
  }));
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

interface SupplierRow {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  opening_balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toSupplier(r: SupplierRow): Supplier {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
    openingBalance: r.opening_balance,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listSuppliers(search?: string): Promise<Supplier[]> {
  const env = await getEnv();
  if (search) {
    const like = `%${search}%`;
    const { results } = await env.DB.prepare(
      `SELECT * FROM suppliers WHERE name LIKE ?1 OR phone LIKE ?1 OR address LIKE ?1 ORDER BY name ASC`
    )
      .bind(like)
      .all<SupplierRow>();
    return (results ?? []).map(toSupplier);
  }
  const { results } = await env.DB.prepare("SELECT * FROM suppliers ORDER BY name ASC").all<SupplierRow>();
  return (results ?? []).map(toSupplier);
}

export async function getSupplier(id: number): Promise<Supplier | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT * FROM suppliers WHERE id = ?1").bind(id).first<SupplierRow>();
  return row ? toSupplier(row) : null;
}

export async function createSupplier(input: NewSupplierInput): Promise<Supplier> {
  const env = await getEnv();
  const row = await env.DB.prepare(
    `INSERT INTO suppliers (name, phone, address, opening_balance, notes) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING *`
  )
    .bind(
      input.name,
      input.phone || null,
      input.address || null,
      input.openingBalance ?? 0,
      input.notes ?? null
    )
    .first<SupplierRow>();
  return toSupplier(row!);
}

export interface SupplierUpdateInput {
  name?: string;
  phone?: string | null;
  address?: string | null;
  openingBalance?: number;
  notes?: string | null;
}

export async function updateSupplier(
  id: number,
  input: SupplierUpdateInput
): Promise<Supplier | null> {
  const env = await getEnv();
  const existing = await getSupplier(id);
  if (!existing) return null;

  const row = await env.DB.prepare(
    `UPDATE suppliers SET name = ?1, phone = ?2, address = ?3, opening_balance = ?4, notes = ?5,
       updated_at = datetime('now')
     WHERE id = ?6 RETURNING *`
  )
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone || null : existing.phone,
      input.address !== undefined ? input.address || null : existing.address,
      input.openingBalance ?? existing.openingBalance,
      input.notes !== undefined ? input.notes : existing.notes,
      id
    )
    .first<SupplierRow>();
  return row ? toSupplier(row) : null;
}

export async function deleteSupplier(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM suppliers WHERE id = ?1").bind(id).run();
}

// ---------------------------------------------------------------------------
// Items — the stock catalog purchased from suppliers.
// ---------------------------------------------------------------------------

interface ItemRow {
  id: number;
  name: string;
  cost: number;
  margin: number;
  returnable: number;
  opening_stock: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Only present on rows from ITEM_SELECT (joined), not plain RETURNING *. */
  purchased_qty?: number;
}

// LEFT JOINs a correlated sum of everything received via Purchases, so
// current stock never drifts out of sync with a separately-maintained
// counter — it's always opening_stock + purchase history, computed fresh.
const ITEM_SELECT = `
  SELECT i.*, COALESCE((SELECT SUM(pi.qty) FROM purchase_items pi WHERE pi.item_id = i.id), 0) AS purchased_qty
  FROM items i
`;

function toItem(r: ItemRow): Item {
  return {
    id: r.id,
    name: r.name,
    cost: r.cost,
    margin: r.margin,
    salePrice: r.cost + r.margin,
    returnable: !!r.returnable,
    openingStock: r.opening_stock,
    currentStock: r.opening_stock + (r.purchased_qty ?? 0),
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listItems(search?: string): Promise<Item[]> {
  const env = await getEnv();
  if (search) {
    const { results } = await env.DB.prepare(
      `${ITEM_SELECT} WHERE i.name LIKE ?1 ORDER BY i.name ASC`
    )
      .bind(`%${search}%`)
      .all<ItemRow>();
    return (results ?? []).map(toItem);
  }
  const { results } = await env.DB.prepare(`${ITEM_SELECT} ORDER BY i.name ASC`).all<ItemRow>();
  return (results ?? []).map(toItem);
}

export async function getItem(id: number): Promise<Item | null> {
  const env = await getEnv();
  const row = await env.DB.prepare(`${ITEM_SELECT} WHERE i.id = ?1`).bind(id).first<ItemRow>();
  return row ? toItem(row) : null;
}

export async function createItem(input: NewItemInput): Promise<Item> {
  const env = await getEnv();
  const inserted = await env.DB.prepare(
    `INSERT INTO items (name, cost, margin, returnable, opening_stock, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id`
  )
    .bind(
      input.name,
      input.cost ?? 0,
      input.margin ?? 0,
      input.returnable ? 1 : 0,
      input.openingStock ?? 0,
      input.notes ?? null
    )
    .first<{ id: number }>();
  return (await getItem(inserted!.id))!;
}

export interface ItemUpdateInput {
  name?: string;
  cost?: number;
  margin?: number;
  returnable?: boolean;
  openingStock?: number;
  notes?: string | null;
}

export async function updateItem(id: number, input: ItemUpdateInput): Promise<Item | null> {
  const env = await getEnv();
  const existing = await getItem(id);
  if (!existing) return null;

  await env.DB.prepare(
    `UPDATE items SET name = ?1, cost = ?2, margin = ?3, returnable = ?4, opening_stock = ?5,
       notes = ?6, updated_at = datetime('now')
     WHERE id = ?7`
  )
    .bind(
      input.name ?? existing.name,
      input.cost ?? existing.cost,
      input.margin ?? existing.margin,
      (input.returnable ?? existing.returnable) ? 1 : 0,
      input.openingStock ?? existing.openingStock,
      input.notes !== undefined ? input.notes : existing.notes,
      id
    )
    .run();
  return getItem(id);
}

export async function deleteItem(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM items WHERE id = ?1").bind(id).run();
}

// ---------------------------------------------------------------------------
// Purchases — stock received from a supplier, with line items.
// ---------------------------------------------------------------------------

interface PurchaseRow {
  id: number;
  supplier_id: number;
  supplier_name: string;
  receipt_no: string | null;
  received_date: string;
  notes: string | null;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

interface PurchaseLineRow {
  id: number;
  purchase_id: number;
  item_id: number;
  item_name: string;
  qty: number;
  unit_cost: number;
  line_total: number;
}

function toPurchaseLine(r: PurchaseLineRow): PurchaseLine {
  return {
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    qty: r.qty,
    unitCost: r.unit_cost,
    lineTotal: r.line_total,
  };
}

const PURCHASE_SELECT = `
  SELECT p.id, p.supplier_id, s.name AS supplier_name, p.receipt_no, p.received_date,
         p.notes, p.total_cost, p.created_at, p.updated_at
  FROM purchases p
  JOIN suppliers s ON s.id = p.supplier_id
`;

async function attachPurchaseLines(env: Awaited<ReturnType<typeof getEnv>>, rows: PurchaseRow[]): Promise<Purchase[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map((_, i) => `?${i + 1}`).join(", ");
  const { results } = await env.DB.prepare(
    `SELECT pi.id, pi.purchase_id, pi.item_id, i.name AS item_name, pi.qty, pi.unit_cost, pi.line_total
     FROM purchase_items pi
     JOIN items i ON i.id = pi.item_id
     WHERE pi.purchase_id IN (${placeholders})
     ORDER BY pi.id ASC`
  )
    .bind(...ids)
    .all<PurchaseLineRow>();

  const linesByPurchase = new Map<number, PurchaseLine[]>();
  for (const line of results ?? []) {
    const list = linesByPurchase.get(line.purchase_id) ?? [];
    list.push(toPurchaseLine(line));
    linesByPurchase.set(line.purchase_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    receiptNo: r.receipt_no,
    receivedDate: r.received_date,
    notes: r.notes,
    totalCost: r.total_cost,
    lines: linesByPurchase.get(r.id) ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function listPurchases(): Promise<Purchase[]> {
  const env = await getEnv();
  const { results } = await env.DB.prepare(
    `${PURCHASE_SELECT} ORDER BY p.received_date DESC, p.id DESC`
  ).all<PurchaseRow>();
  return attachPurchaseLines(env, results ?? []);
}

export async function getPurchase(id: number): Promise<Purchase | null> {
  const env = await getEnv();
  const row = await env.DB.prepare(`${PURCHASE_SELECT} WHERE p.id = ?1`).bind(id).first<PurchaseRow>();
  if (!row) return null;
  const [purchase] = await attachPurchaseLines(env, [row]);
  return purchase;
}

export async function createPurchase(input: NewPurchaseInput): Promise<Purchase> {
  const env = await getEnv();
  const totalCost = input.lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);

  const inserted = await env.DB.prepare(
    `INSERT INTO purchases (supplier_id, receipt_no, received_date, notes, total_cost)
     VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id`
  )
    .bind(input.supplierId, input.receiptNo || null, input.receivedDate, input.notes ?? null, totalCost)
    .first<{ id: number }>();
  const purchaseId = inserted!.id;

  for (const line of input.lines) {
    await env.DB.prepare(
      `INSERT INTO purchase_items (purchase_id, item_id, qty, unit_cost, line_total)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
      .bind(purchaseId, line.itemId, line.qty, line.unitCost, line.qty * line.unitCost)
      .run();
  }

  return (await getPurchase(purchaseId))!;
}

export async function deletePurchase(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM purchase_items WHERE purchase_id = ?1").bind(id).run();
  await env.DB.prepare("DELETE FROM purchases WHERE id = ?1").bind(id).run();
}

/** Suggests the next GRN-YYYYMMDD-NNN, based on today's date and how many purchases already exist for today. */
export async function suggestReceiptNo(): Promise<string> {
  const env = await getEnv();
  const today = await env.DB.prepare("SELECT strftime('%Y%m%d', 'now') AS d").first<{ d: string }>();
  const datePart = today!.d;
  const prefix = `GRN-${datePart}-`;
  const row = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM purchases WHERE receipt_no LIKE ?1"
  )
    .bind(`${prefix}%`)
    .first<{ count: number }>();
  const next = (row?.count ?? 0) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Payments In — customer payments not tied to a specific order.
// ---------------------------------------------------------------------------

interface PaymentInRow {
  id: number;
  customer_id: number;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  note: string | null;
  created_at: string;
  updated_at: string;
}

function toPaymentIn(r: PaymentInRow): PaymentIn {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    amount: r.amount,
    paymentDate: r.payment_date,
    method: r.method,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const PAYMENT_IN_SELECT = `
  SELECT p.id, p.customer_id, c.name AS customer_name, p.amount, p.payment_date, p.method, p.note,
         p.created_at, p.updated_at
  FROM payments_in p
  JOIN customers c ON c.id = p.customer_id
`;

export interface PaymentInFilters {
  customerId?: number;
  from?: string;
  to?: string;
}

export async function listPaymentsIn(filters: PaymentInFilters = {}): Promise<PaymentIn[]> {
  const env = await getEnv();
  const clauses: string[] = [];
  const binds: unknown[] = [];

  if (filters.customerId) {
    clauses.push("p.customer_id = ?");
    binds.push(filters.customerId);
  }
  if (filters.from) {
    clauses.push("p.payment_date >= ?");
    binds.push(filters.from);
  }
  if (filters.to) {
    clauses.push("p.payment_date <= ?");
    binds.push(filters.to);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const { results } = await env.DB.prepare(
    `${PAYMENT_IN_SELECT} ${where} ORDER BY p.payment_date DESC, p.id DESC`
  )
    .bind(...binds)
    .all<PaymentInRow>();
  return (results ?? []).map(toPaymentIn);
}

export async function createPaymentIn(input: NewPaymentInInput): Promise<PaymentIn> {
  const env = await getEnv();
  const inserted = await env.DB.prepare(
    `INSERT INTO payments_in (customer_id, amount, payment_date, method, note)
     VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id`
  )
    .bind(input.customerId, input.amount, input.paymentDate, input.method, input.note ?? null)
    .first<{ id: number }>();
  const row = await env.DB.prepare(`${PAYMENT_IN_SELECT} WHERE p.id = ?1`)
    .bind(inserted!.id)
    .first<PaymentInRow>();
  return toPaymentIn(row!);
}

export async function deletePaymentIn(id: number): Promise<void> {
  const env = await getEnv();
  await env.DB.prepare("DELETE FROM payments_in WHERE id = ?1").bind(id).run();
}

/**
 * The "Money" balance summary for a customer's detail page. Splits activity
 * into "before today" (currentOutstanding) and "today" (todaysSale,
 * cashCollected), since an order's payment_status has no separate
 * settlement timestamp — an order paid the same day it's created is treated
 * as collected today; paid on a later day, its total already left
 * currentOutstanding as of that day.
 */
export async function getCustomerBalance(customerId: number): Promise<CustomerBalance> {
  const env = await getEnv();

  const orderRow = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN date(created_at) < date('now') THEN total_price ELSE 0 END), 0) AS prior_sales,
       COALESCE(SUM(CASE WHEN date(created_at) < date('now') AND payment_status != 'unpaid' THEN total_price ELSE 0 END), 0) AS prior_paid,
       COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total_price ELSE 0 END), 0) AS todays_sale,
       COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND payment_status != 'unpaid' THEN total_price ELSE 0 END), 0) AS todays_paid_via_order
     FROM orders WHERE customer_id = ?1 AND status != 'cancelled'`
  )
    .bind(customerId)
    .first<{ prior_sales: number; prior_paid: number; todays_sale: number; todays_paid_via_order: number }>();

  const paymentRow = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN payment_date < date('now') THEN amount ELSE 0 END), 0) AS prior_payments,
       COALESCE(SUM(CASE WHEN payment_date = date('now') THEN amount ELSE 0 END), 0) AS todays_payments
     FROM payments_in WHERE customer_id = ?1`
  )
    .bind(customerId)
    .first<{ prior_payments: number; todays_payments: number }>();

  const customer = await getCustomer(customerId);
  const openingBalance = customer?.openingBalance ?? 0;

  const currentOutstanding =
    openingBalance + (orderRow?.prior_sales ?? 0) - (orderRow?.prior_paid ?? 0) - (paymentRow?.prior_payments ?? 0);
  const todaysSale = orderRow?.todays_sale ?? 0;
  const cashCollected = (orderRow?.todays_paid_via_order ?? 0) + (paymentRow?.todays_payments ?? 0);

  return {
    currentOutstanding,
    todaysSale,
    cashCollected,
    newOutstanding: currentOutstanding + todaysSale - cashCollected,
  };
}
