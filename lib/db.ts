// D1 data-access layer for orders.
import "server-only";
import { getEnv } from "./cf";
import type { NewOrderInput, Order, OrderStatus } from "./orders";

interface OrderRow {
  id: number;
  customer_name: string;
  address: string;
  bottles: number;
  rate_per_bottle: number;
  total_price: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    customerName: r.customer_name,
    address: r.address,
    bottles: r.bottles,
    ratePerBottle: r.rate_per_bottle,
    totalPrice: r.total_price,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface OrderFilters {
  status?: OrderStatus;
  /** Matches against customer name or address (case-insensitive substring). */
  search?: string;
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const env = await getEnv();
  const clauses: string[] = [];
  const binds: unknown[] = [];

  if (filters.status) {
    clauses.push("status = ?");
    binds.push(filters.status);
  }
  if (filters.search) {
    clauses.push("(customer_name LIKE ? OR address LIKE ?)");
    const like = `%${filters.search}%`;
    binds.push(like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const stmt = env.DB.prepare(
    `SELECT * FROM orders ${where} ORDER BY created_at DESC, id DESC`
  );
  const { results } = await stmt.bind(...binds).all<OrderRow>();
  return (results ?? []).map(toOrder);
}

export async function getOrder(id: number): Promise<Order | null> {
  const env = await getEnv();
  const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?1")
    .bind(id)
    .first<OrderRow>();
  return row ? toOrder(row) : null;
}

export async function createOrder(input: NewOrderInput): Promise<Order> {
  const env = await getEnv();
  const total = input.bottles * input.ratePerBottle;
  const row = await env.DB.prepare(
    `INSERT INTO orders (customer_name, address, bottles, rate_per_bottle, total_price, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     RETURNING *`
  )
    .bind(
      input.customerName,
      input.address,
      input.bottles,
      input.ratePerBottle,
      total,
      input.status
    )
    .first<OrderRow>();
  return toOrder(row!);
}

export interface OrderUpdateInput {
  customerName?: string;
  address?: string;
  bottles?: number;
  ratePerBottle?: number;
  status?: OrderStatus;
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

  const row = await env.DB.prepare(
    `UPDATE orders SET
       customer_name = ?1,
       address = ?2,
       bottles = ?3,
       rate_per_bottle = ?4,
       total_price = ?5,
       status = ?6,
       updated_at = datetime('now')
     WHERE id = ?7
     RETURNING *`
  )
    .bind(
      input.customerName ?? existing.customerName,
      input.address ?? existing.address,
      bottles,
      rate,
      total,
      input.status ?? existing.status,
      id
    )
    .first<OrderRow>();
  return row ? toOrder(row) : null;
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
