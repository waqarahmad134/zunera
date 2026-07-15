# Deploying to Hostinger shared hosting

Two pieces get deployed separately:

- **`hostinger-app/`** (this directory) — the Laravel JSON API + MySQL database.
- **`spa/`** — the React admin/staff/portal frontend, built to static files.

They can live on the same domain (e.g. API under `/api` behind a reverse
proxy) or on separate subdomains (e.g. `api.yourdomain.com` +
`yourdomain.com`). The instructions below assume separate subdomains, since
that's the simplest thing to set up with only hPanel (no server config
access) — swap in your own domain names throughout.

## 1. Create the MySQL database

Hostinger shared hosting only offers PHP + MySQL — no Node.js, no custom
services — which is exactly why this app is Laravel + a plain static SPA
build rather than anything requiring a long-running Node process.

In hPanel: **Databases → MySQL Databases** → create a database and a user,
grant the user full privileges on it. Note the database name, username,
password, and host (usually `localhost` or `127.0.0.1` — hPanel shows the
exact value). **phpMyAdmin** is reachable from the same page — that's where
you'll import the schema if you don't have SSH (step 3b).

## 2. Upload the Laravel app

Check whether your plan includes **SSH access** (hPanel → Advanced → SSH
Access). This changes steps 3 and 4 below.

Either way, upload `hostinger-app/` **outside** any domain's public web
root — e.g. to `~/jubilee-api/` — not into `public_html/` directly, since
`public_html/` must only ever expose Laravel's `public/` subdirectory (the
rest of the app — `.env`, `app/`, `vendor/` — must never be web-accessible).

Then point your API subdomain's document root at `~/jubilee-api/public`:
hPanel → **Domains → Subdomains** → create `api.yourdomain.com` → under
"Advanced" set its document root to `jubilee-api/public`. This is the clean
way to do it on Hostinger without any `.htaccess`/`index.php` path hacking.

Before uploading, run `composer install --no-dev --optimize-autoloader`
locally (or via SSH once connected) so `vendor/` is populated — Hostinger
shared hosting has no Composer available in most plans, and even where it
does, running it over a slow shared-hosting connection is best avoided.

## 3a. With SSH access (recommended)

```bash
ssh yourusername@yourdomain.com
cd ~/jubilee-api
cp .env.example .env
php artisan key:generate
# edit .env: DB_DATABASE / DB_USERNAME / DB_PASSWORD from step 1,
# APP_URL, ADMIN_PASSWORD, CORS_ALLOWED_ORIGINS, VAPID_* (see .env.example
# for what each does)
php artisan migrate --force
```

## 3b. Without SSH access — import via phpMyAdmin

1. Generate `APP_KEY` locally: `php artisan key:generate --show`, paste the
   value into `.env`'s `APP_KEY=` on the server (via hPanel's File Manager
   or FTP).
2. Fill in `.env` (copy from `.env.example`) with the DB credentials from
   step 1, plus `ADMIN_PASSWORD`, `APP_URL`, `CORS_ALLOWED_ORIGINS`, and the
   `VAPID_*` keys.
3. In phpMyAdmin, select your database → **Import** → choose
   `database/hostinger-import/jubilee_water_schema.sql` (already generated
   and verified against a real MySQL/MariaDB instance — creates all 21
   tables and marks all 15 migrations as applied). This is a snapshot, not
   a live migration runner — if the schema changes later and you still have
   no SSH, someone needs to write the equivalent `ALTER TABLE` by hand or
   this file needs regenerating (`php artisan migrate:fresh` locally
   against a MySQL connection, then `mysqldump --no-data
   --add-drop-table --skip-comments`).

Either path, verify with `https://api.yourdomain.com/api/login` (POST) or
just `https://api.yourdomain.com/up` (Laravel's built-in health check,
should return 200).

## 4. Build and deploy the SPA

Locally (or in CI):

```bash
cd spa
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production
npm install
npm run build
```

Upload the contents of `spa/dist/` to `yourdomain.com`'s `public_html/`
(this one — unlike the Laravel app — IS meant to be the document root
directly, it's a plain static site: HTML/CSS/JS + the PWA manifest/service
worker/icons).

Since this is a client-side-routed SPA (react-router in "browser" mode, not
hash routing), deep links like `yourdomain.com/admin/orders` need the
server to serve `index.html` for any path that isn't a real file, or a
hard-refresh on those routes 404s. Add this to `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 5. Smoke test

- `https://yourdomain.com/login` loads and logging in as admin (blank
  phone, the `ADMIN_PASSWORD` from `.env`) reaches the dashboard.
- Create a customer, an order, a supplier/item/purchase — confirm they
  persist (phpMyAdmin → browse the table, or just reload the page).
- If push notifications matter to you, confirm the VAPID public key in
  `spa/src/lib/push-public-key.ts` matches `VAPID_PUBLIC_KEY` in the
  server's `.env` — they must be the same keypair.

## What's intentionally different from the Cloudflare version

- Sessions are bearer tokens in `localStorage`, not cookies — no CSRF
  story needed since the API and SPA aren't relying on cookie auth.
- `SESSION_DRIVER=file`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync` in
  `.env.example` — Hostinger shared hosting has no Redis/Memcached, and
  nothing in this app currently needs a real queue worker.
- Password hashing is bcrypt (Laravel's default, via `Hash::make`), not the
  old app's hand-rolled PBKDF2-over-WebCrypto — existing password hashes
  from the D1 database do NOT carry over; anyone migrating real data needs
  to reset passwords (admin's shared password, employee/customer portal
  passwords) after import.
