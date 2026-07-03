// D1 data-access layer.
import "server-only";
import { getEnv } from "./cf";
import type { NewOrderInput, Order, OrderStatus } from "./orders";
import type { Customer, CustomerSummary, NewCustomerInput } from "./customers";
import type { Expense, ExpenseCategory, NewExpenseInput } from "./expenses";
import type { Employee, EmployeeStatus, NewEmployeeInput } from "./employees";
import type { Notification } from "./notifications";
import type { EmployeeLocation } from "./locations";
import type { Role } from "./session";

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
  assigned_employee_id: number | null;
  assigned_employee_name: string | null;
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
    assignedEmployeeId: r.assigned_employee_id,
    assignedEmployeeName: r.assigned_employee_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const ORDER_SELECT = `
  SELECT o.id, o.customer_id, c.name AS customer_name, o.address, o.bottles,
         o.rate_per_bottle, o.total_price, o.status,
         o.assigned_employee_id, e.name AS assigned_employee_name,
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
    `INSERT INTO orders (customer_id, address, bottles, rate_per_bottle, total_price, status, assigned_employee_id)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     RETURNING id`
  )
    .bind(
      input.customerId,
      input.address,
      input.bottles,
      input.ratePerBottle,
      total,
      input.status,
      input.assignedEmployeeId ?? null
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
  /** undefined = leave unchanged, null = unassign, number = assign to that employee. */
  assignedEmployeeId?: number | null;
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
       assigned_employee_id = ?7,
       updated_at = datetime('now')
     WHERE id = ?8`
  )
    .bind(
      input.customerId ?? existing.customerId,
      input.address ?? existing.address,
      bottles,
      rate,
      total,
      input.status ?? existing.status,
      input.assignedEmployeeId !== undefined ? input.assignedEmployeeId : existing.assignedEmployeeId,
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
  created_at: string;
  updated_at: string;
}

function toCustomer(r: CustomerRow): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address,
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
    `INSERT INTO customers (name, phone, address, password_hash) VALUES (?1, ?2, ?3, ?4) RETURNING *`
  )
    .bind(input.name, input.phone || null, input.address, passwordHash)
    .first<CustomerRow>();
  return toCustomer(row!);
}

export interface CustomerUpdateInput {
  name?: string;
  phone?: string | null;
  address?: string;
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
    `UPDATE customers SET name = ?1, phone = ?2, address = ?3, password_hash = ?4, updated_at = datetime('now')
     WHERE id = ?5 RETURNING *`
  )
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone || null : existing.phone,
      input.address ?? existing.address,
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
    `INSERT INTO expenses (title, category, amount, expense_date) VALUES (?1, ?2, ?3, ?4) RETURNING *`
  )
    .bind(input.title, input.category, input.amount, input.expenseDate)
    .first<ExpenseRow>();
  return toExpense(row!);
}

export interface ExpenseUpdateInput {
  title?: string;
  category?: ExpenseCategory;
  amount?: number;
  expenseDate?: string;
}

export async function updateExpense(
  id: number,
  input: ExpenseUpdateInput
): Promise<Expense | null> {
  const env = await getEnv();
  const existing = await getExpense(id);
  if (!existing) return null;

  const row = await env.DB.prepare(
    `UPDATE expenses SET title = ?1, category = ?2, amount = ?3, expense_date = ?4, updated_at = datetime('now')
     WHERE id = ?5 RETURNING *`
  )
    .bind(
      input.title ?? existing.title,
      input.category ?? existing.category,
      input.amount ?? existing.amount,
      input.expenseDate ?? existing.expenseDate,
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
    `INSERT INTO employees (name, phone, role, salary, joined_date, status, password_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING *`
  )
    .bind(input.name, input.phone || null, input.role, input.salary, input.joinedDate, input.status, passwordHash)
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
       password_hash = ?7, updated_at = datetime('now')
     WHERE id = ?8 RETURNING *`
  )
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone || null : existing.phone,
      input.role ?? existing.role,
      input.salary ?? existing.salary,
      input.joinedDate ?? existing.joinedDate,
      input.status ?? existing.status,
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
    `SELECT l.employee_id, e.name AS employee_name, l.lat, l.lng, l.accuracy, l.updated_at
     FROM employee_locations l
     JOIN employees e ON e.id = l.employee_id
     WHERE e.status = 'active'
     ORDER BY l.updated_at DESC`
  ).all<{
    employee_id: number;
    employee_name: string;
    lat: number;
    lng: number;
    accuracy: number | null;
    updated_at: string;
  }>();
  return (results ?? []).map((r) => ({
    employeeId: r.employee_id,
    employeeName: r.employee_name,
    lat: r.lat,
    lng: r.lng,
    accuracy: r.accuracy,
    updatedAt: r.updated_at,
  }));
}
