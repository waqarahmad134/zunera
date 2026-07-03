# Jubilee Water — Admin

An order-tracking admin panel for a water bottle delivery business. Admin
staff log each customer's order (name, address, bottle count, price) and
update its delivery status. Built to double as the backend for a future
mobile app — the same REST API the web admin uses is ready for a Flutter/
React Native client later.

Runs on **Cloudflare Workers** (via OpenNext) with **Cloudflare D1** (SQLite)
for storage. No customer-facing pages — this is admin-only, matching how the
business actually takes orders today (staff enter them on behalf of callers).

## Stack

- Next.js 16 (App Router) + TypeScript
- Cloudflare Workers + D1, deployed via `@opennextjs/cloudflare`
- Tailwind CSS v4
- Hand-rolled charts (SVG + framer-motion) — no charting library

## Data model

One `orders` table (see `migrations/0001_init.sql`):

| Field | Notes |
|---|---|
| customer_name, address | required |
| bottles | positive integer |
| rate_per_bottle | price per bottle |
| total_price | `bottles × rate_per_bottle`, computed server-side on every write |
| status | `pending` \| `delivered` \| `cancelled` |
| created_at / updated_at | set by the database |

## Admin panel

- **Dashboard** (`/admin`) — stat tiles (total orders, pending, delivered,
  revenue), an order-status breakdown bar, and 14-day orders/revenue charts.
- **Orders** (`/admin/orders`) — a table of every order with status filter
  tabs and a name/address search. Click a row to open a side drawer and edit
  the order or change its status; delete from the row or the drawer.
- **New order** (`/admin/orders/new`) — a dedicated page (not a drawer) for
  logging a new customer order.

Auth is a single shared admin password (env `ADMIN_PASSWORD`), the same
pattern as a typical small-team internal tool: HMAC-signed cookie set by
`/api/admin/login`, checked by `middleware.ts` on every `/admin` and
`/api/admin` route.

## REST API (for the web admin today, a mobile app later)

| Route | Notes |
|---|---|
| `GET /api/admin/orders?status=&search=` | list, optional filters |
| `POST /api/admin/orders` | create |
| `GET /api/admin/orders/:id` | fetch one |
| `PATCH /api/admin/orders/:id` | update any subset of fields, incl. status |
| `DELETE /api/admin/orders/:id` | delete |
| `GET /api/admin/stats` | dashboard aggregates (totals + 14-day series) |

All are cookie-authenticated today. Add a token-based auth mode alongside the
cookie when the mobile app is built, without needing to change these routes.

## One-time setup

```bash
npm install
npx wrangler login

# D1 database — already created for this project:
#   database_id in wrangler.jsonc is 55bdc8da-b0c3-4b5c-9702-fdb727f27876
# If you ever need a new one instead:
#   npx wrangler d1 create jubilee-water   (then update wrangler.jsonc)

npx wrangler secret put ADMIN_PASSWORD   # sets the production admin password
```

## Database

```bash
npm run db:migrate:local   # local Miniflare simulator (for `npm run dev`)
npm run db:migrate         # the real remote D1 — run this before first deploy
```

## Develop

```bash
npm run dev
```

Visit `http://localhost:3000/admin` — dev password is `admin123` (falls back
automatically when `ADMIN_PASSWORD` isn't set locally).

## Deploy

```bash
npm run db:migrate    # once, or after adding a new migration
npm run deploy         # opennextjs-cloudflare build + deploy
```

## Regenerating binding types

After changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```
