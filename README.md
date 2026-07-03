# Jubilee Water

An order-tracking system for a water bottle delivery business, with three
scoped apps behind one login: **admin** (full management), **staff**
(drivers view orders and update delivery status), and **portal** (customers
see their own order history). Installable as a PWA with push notifications
and live employee location tracking on a map. Built to double as the
backend for a future mobile app — the same REST API these apps use is ready
for a Flutter/React Native client later.

Runs on **Cloudflare Workers** (via OpenNext) with **Cloudflare D1** (SQLite)
for storage. Everything is free to run: no paid services anywhere — Web
Push uses browsers' own free push services (VAPID, no vendor account), and
the live map uses free OpenStreetMap tiles (no API key).

## Stack

- Next.js 16 (App Router) + TypeScript
- Cloudflare Workers + D1, deployed via `@opennextjs/cloudflare`
- Tailwind CSS v4
- Hand-rolled charts (SVG + framer-motion) — no charting library
- Hand-rolled Web Push (VAPID + aes128gcm encryption via Web Crypto) — no
  `web-push` package, since it needs Node's `https` module which isn't
  available on Workers
- Leaflet + OpenStreetMap for the live employee map

## Who can log in

One unified `/login` — leave the phone number blank for the admin
password; enter a phone + password for staff or customer accounts (set by
the admin when creating/editing an employee or customer).

| Role | Sees | Can do |
|---|---|---|
| **Admin** (`/admin`) | Everything | Full CRUD on orders, customers, employees, expenses; reports; live map |
| **Staff** (`/staff`) | Every order | View orders, update delivery status only — no create/delete, no access to customers/expenses/employees/reports |
| **Portal** (`/portal`) | Their own orders | Read-only — their own stats and order history, nothing else |

`middleware.ts` gates `/admin`, `/staff` and `/portal` (and their `/api/*`
counterparts) by a signed session cookie's role, checked on every request.

## Notifications

Assigning an order to an employee notifies that employee; an employee
updating an order's status notifies admin. Delivered two ways:

- **In-app**: a bell icon (in every shell) polls `/api/{admin,staff,portal}/notifications`.
- **Push**: if the user grants permission, a real browser push notification
  arrives even when the tab is closed, via the service worker (`public/sw.js`)
  and the hand-rolled Web Push sender in `lib/webpush.ts`.

## PWA

`public/manifest.webmanifest` + `public/sw.js` make the app installable on
desktop and mobile (Add to Home Screen). The service worker only handles
push/install — no offline caching, since every view needs live data anyway.

## Live employee map

Drivers opt in from a "Share location" toggle in the staff app, which posts
their browser geolocation every 20s to `/api/staff/location`. Admin's
"Live map" page (`/admin/map`) polls `/api/admin/locations` and plots each
active employee on a Leaflet map with free OpenStreetMap tiles.

## Data model

Core tables (see `migrations/`): `orders` (customer_id, address, bottles,
rate_per_bottle, total_price, status, assigned_employee_id), `customers`
(name, phone, address, password_hash), `employees` (name, phone, role,
salary, joined_date, status, password_hash), `expenses`, `notifications`,
`push_subscriptions`, `employee_locations`.

## Admin panel

- **Dashboard** (`/admin`) — stat tiles (total orders, pending, delivered,
  revenue), an order-status breakdown bar, and 14-day orders/revenue charts.
- **Orders** (`/admin/orders`) — table with status filter tabs, search, and
  an optional employee assignment per order. Click a row to open a side
  drawer and edit; delete from the row or the drawer.
- **Customers** / **Employees** / **Expenses** — same table + drawer +
  dedicated "new" page pattern; customers and employees can each get a
  portal/staff login password set here.
- **Reports** (`/admin/reports`) — revenue vs. expenses over a date range.
- **Live map** (`/admin/map`) — see "Live employee map" above.

## REST API (for the web apps today, a mobile app later)

All routes are cookie-authenticated by role (see "Who can log in" above).
The admin API is the fullest — e.g.:

| Route | Notes |
|---|---|
| `GET /api/admin/orders?status=&search=&customerId=` | list, optional filters |
| `POST /api/admin/orders` | create (accepts `assignedEmployeeId`) |
| `PATCH /api/admin/orders/:id` | update any subset of fields, incl. status/assignment |
| `DELETE /api/admin/orders/:id` | delete |
| `GET /api/admin/stats` | dashboard aggregates |
| `GET/PATCH/DELETE /api/admin/{customers,employees,expenses}[/:id]` | CRUD |
| `GET /api/admin/locations` | latest employee locations |

`/api/staff/orders` (GET) and `/api/staff/orders/:id` (PATCH — status only)
mirror a subset for the staff app; `/api/portal/me` returns the logged-in
customer's own profile/summary/orders. Add a token-based auth mode alongside
the cookie when the mobile app is built, without needing to change these
routes.

## One-time setup

```bash
npm install
npx wrangler login

# D1 database — already created for this project:
#   database_id in wrangler.jsonc is 55bdc8da-b0c3-4b5c-9702-fdb727f27876
# If you ever need a new one instead:
#   npx wrangler d1 create jubilee-water   (then update wrangler.jsonc)

npx wrangler secret put ADMIN_PASSWORD    # sets the production admin password
```

`VAPID_PRIVATE_KEY` is the private half of a Web Push signing keypair — the
public half is committed in `lib/push-public-key.ts` (not secret, browsers
receive it anyway). Web Push works out of the box, in dev and in
production, using a built-in fallback keypair in `lib/vapid.ts` — no secret
setup required to get started (in-app notifications also work regardless).
To use your own keypair instead of the built-in one, generate a pair and
set it as a secret, which always takes priority over the fallback:

```bash
node -e "
const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const b64url = (b) => b.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const pub = publicKey.export({ format: 'jwk' }), priv = privateKey.export({ format: 'jwk' });
console.log('VAPID_PUBLIC_KEY =', b64url(Buffer.concat([Buffer.from([4]), Buffer.from(pub.x,'base64'), Buffer.from(pub.y,'base64')])));
console.log('VAPID_PRIVATE_KEY =', b64url(Buffer.from(priv.d,'base64')));
"
```

Paste `VAPID_PUBLIC_KEY` into `lib/push-public-key.ts` and set
`VAPID_PRIVATE_KEY` via `npx wrangler secret put VAPID_PRIVATE_KEY`.

## Database

```bash
npm run db:migrate:local   # local Miniflare simulator (for `npm run dev`)
npm run db:migrate         # the real remote D1 — run this before first deploy
```

## Develop

```bash
npm run dev
```

Visit `http://localhost:3000/login` — dev admin password is `admin123`
(falls back automatically when `ADMIN_PASSWORD` isn't set locally). Create a
staff/customer login from the admin panel to test `/staff` and `/portal`.

## Deploy

```bash
npm run db:migrate    # once, or after adding a new migration
npm run deploy         # opennextjs-cloudflare build + deploy
```

> **Do not run `npm run deploy` (or `preview`) from native Windows
> (PowerShell/cmd).** OpenNext's Cloudflare adapter is not fully compatible
> with Windows — building there bakes broken chunk paths into the Worker,
> which surfaces in production as `Internal Server Error` with
> `ChunkLoadError` / `components.ComponentMod.handler is not a function` in
> the Cloudflare dashboard's Logs. It deploys "successfully" (no error at
> deploy time) but the running Worker is broken. If you're on Windows, either
> deploy exclusively through GitHub Actions below (build runs on Linux), or
> run these commands inside **WSL2**, never a native Windows shell.

## Auto-deploy on push (GitHub Actions)

Every push to `jubilee-water` runs `.github/workflows/deploy.yml`: it applies
any new D1 migrations, then builds and deploys the Worker. One-time setup:

1. Create a Cloudflare API token: **dash.cloudflare.com → My Profile → API
   Tokens → Create Token**. The "Edit Cloudflare Workers" template covers
   Workers + D1; if using a custom token, grant **Workers Scripts: Edit**
   and **D1: Edit** for your account.
2. In the GitHub repo: **Settings → Secrets and variables → Actions → New
   repository secret**, name it `CLOUDFLARE_API_TOKEN`, paste the token.
3. Push to `jubilee-water` — check the **Actions** tab for the run.

`ADMIN_PASSWORD` and `VAPID_PRIVATE_KEY` are Worker secrets, not repo
secrets — set once via `wrangler secret put` (see above) and persist across
deploys; the workflow doesn't need to touch them.

## Regenerating binding types

After changing `wrangler.jsonc`:

```bash
npm run cf-typegen
```
