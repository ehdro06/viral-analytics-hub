# ViralLink Web

Next.js dashboard for the ViralLink URL platform: sign in with Google or GitHub, create short links, watch clicks
arrive in near real time, and unshorten any URL with a safety check.

**Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, Recharts.

## Pages

| Route | Purpose |
|---|---|
| `/` | Public landing page with the URL expander (redirect chain + Google Safe Browsing check) |
| `/login` | OAuth login (Google / GitHub), handled by the user service |
| `/dashboard` | Live stats: clicks in the last minute / 24h, unique visitors, peak per minute, charts |
| `/analytics` | Clicks over time, top referrers, geography |
| `/links` | Create, copy and delete short links (optimistic updates) |

## How it talks to the backend

The browser only calls the Next.js origin. `next.config.ts` rewrites requests to the services:

| Path | Service |
|---|---|
| `/api/v1/links/*`, `/api/v1/expand` | redirect (`REDIRECT_SERVICE_URL`, default `:8081`) |
| `/api/v1/analytics/*` | analytics (`ANALYTICS_SERVICE_URL`, default `:8082`) |
| `/api/*`, `/oauth2/*`, `/login/oauth2/*`, `/logout` | user (`USER_SERVICE_URL`, default `:8080`) |

Auth: the user service sets a session cookie at login. On every page load the app calls `GET /api/v1/users/me`,
which returns the profile plus a short-lived JWT. The JWT is kept **in memory only** (never in localStorage) and is
sent as `Authorization: Bearer ...` to the redirect and analytics services.

## Run locally

```bash
cp .env.example .env.local
pnpm install
pnpm dev                # http://localhost:3000, the backend's default FRONTEND_URL (post-login redirect)
```

The backend services and their setup (`.env`, Docker for Postgres/Redis) are described in the repository root.

## Deploy (Vercel)

Set the variables listed in the Vercel section of `.env.example` and redeploy; they are read at build time.
`next.config.ts` deliberately has no `output: "standalone"`: Vercel does not need it. See `docs/DEPLOY.md`.

## Scripts

`pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint`
