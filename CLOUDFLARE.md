# Running on Cloudflare (Workers + D1 + R2)

This site runs on **Cloudflare Workers** via [OpenNext](https://opennext.js.org/cloudflare).
All content lives in **Cloudflare D1** (SQL) and all uploaded images live in
**Cloudflare R2** (object storage). There is no database server, no GitHub
commit step, and no Vercel — the admin panel writes straight to D1/R2 and
changes are live on the next request.

## How it fits together

| Concern            | Where it lives                                   |
| ------------------ | ------------------------------------------------ |
| Hosting / SSR      | Cloudflare Workers (built by OpenNext)           |
| Content (JSON)     | D1 table `content_items` (see `migrations/`)     |
| Images / media     | R2 bucket `zunera-media`, prefix `uploads/`      |
| Admin auth         | `ADMIN_PASSWORD` secret + HMAC cookie            |

- **Read path:** pages call the helpers in `lib/content.ts`, which query D1
  through `lib/db.ts`. The whole app renders dynamically (`force-dynamic`).
- **Write path:** the admin API routes (`app/api/admin/*`) write to D1 (content)
  and R2 (uploads) using the bindings from `lib/cf.ts`.
- **Serving images:** `/uploads/<name>` is handled by `app/uploads/[...key]`,
  which streams the object from R2. Files committed under `public/uploads` are
  still served as static assets, so older uploads keep working.

The `content/*.json` files remain in the repo only as **seed data** for D1.

## Bindings (`wrangler.jsonc`)

| Binding | Type | Name             |
| ------- | ---- | ---------------- |
| `DB`    | D1   | `zunera` |
| `MEDIA` | R2   | `zunera-media`   |
| `ASSETS`| Assets | (OpenNext)     |

## One-time setup

```bash
# 0. Install dependencies (adds @opennextjs/cloudflare, wrangler, etc.)
npm install

# 1. Log in
npx wrangler login

# 2. Create the D1 database, then paste the printed database_id into
#    wrangler.jsonc -> d1_databases[0].database_id
npx wrangler d1 create zunera

# 3. Create the R2 bucket
npx wrangler r2 bucket create zunera-media

# 4. Set the admin password (production secret)
npx wrangler secret put ADMIN_PASSWORD
```

## Database + media

```bash
# Apply the schema (creates the content_items table)
npm run db:migrate:local     # local simulator
npm run db:migrate           # remote D1

# Seed content from content/*.json
npm run db:seed:local        # local simulator
npm run db:seed              # remote D1

# Move pre-existing images from public/uploads into R2 (optional)
npm run media:upload:local
npm run media:upload
```

## Develop

```bash
npm run dev        # next dev, with local D1/R2 simulators wired up
```

`initOpenNextCloudflareForDev()` in `next.config.ts` exposes the local Miniflare
bindings to `getCloudflareContext()`, so the admin panel and pages work exactly
as in production. The dev admin password falls back to `admin123`.

## Preview & deploy

```bash
npm run preview    # build with OpenNext and run the Worker locally
npm run deploy     # build and deploy to Cloudflare
```

Set `NEXT_PUBLIC_SITE_URL` (Worker/custom domain) as a var or secret so
canonical URLs, the sitemap and `llms.txt` point at the right host.

### Automatic deploys (Workers Builds / Git integration)

If you connect the GitHub repo in the dashboard (Worker → Settings → Builds),
set the commands for OpenNext — the defaults (`npm run build` +
`npx wrangler deploy`) do **not** work, because plain `next build` never
produces `.open-next/worker.js`:

| Field          | Value                              |
| -------------- | ---------------------------------- |
| Build command  | `npx opennextjs-cloudflare build`  |
| Deploy command | `npx opennextjs-cloudflare deploy` |
| Root directory | `/`                                |

Content (D1) and the `ADMIN_PASSWORD` secret are runtime state — a push/deploy
does not touch them. Run `npm run db:migrate` + `npm run db:seed` and
`wrangler secret put ADMIN_PASSWORD` once against the remote resources.

## Regenerating binding types

After changing `wrangler.jsonc`:

```bash
npm run cf-typegen   # overwrites cloudflare-env.d.ts via `wrangler types`
```
