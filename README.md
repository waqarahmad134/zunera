# Zunera

Personal academic site for Zunera — publications, commentary, policy work and a
blog — with a built-in admin panel for managing all content.

Built with **Next.js** (App Router) and deployed on **Cloudflare Workers**:
content lives in **Cloudflare D1** (SQL) and images in **Cloudflare R2** (object
storage). No external CMS or database server.

> **Deploying or setting up Cloudflare?** See [CLOUDFLARE.md](./CLOUDFLARE.md)
> for bindings, one-time setup (D1 + R2 + secrets), seeding and deploy commands.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local dev uses the
Miniflare D1/R2 simulators (see CLOUDFLARE.md for migrating and seeding the
local database). The admin panel is at [/admin](http://localhost:3000/admin).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server (local D1/R2 simulators) |
| `npm run build` | Production Next.js build |
| `npm run preview` | Build + run the real Cloudflare Workers runtime locally |
| `npm run deploy` | Build + deploy to Cloudflare |
| `npm run db:migrate` / `db:seed` | Apply D1 migrations / seed content (remote) |
| `npm run media:upload` | Push local images to the R2 bucket (remote) |

## Project layout

- `app/` — pages and admin, plus the content/media API routes (`app/api/admin/*`)
- `lib/content.ts` — server-side content reads from D1
- `lib/db.ts`, `lib/cf.ts` — D1/R2 bindings access
- `migrations/` — D1 schema
- `content/*.json` — seed data for D1
