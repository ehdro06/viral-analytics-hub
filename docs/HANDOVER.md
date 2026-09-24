# Handover note (for the next agent / developer)

Last updated after commit **`a969228`** (`feat: OAuth JWT bridge, settings UI, and build fixes`). Branch was **ahead of `origin/main`** by several commits — verify `git status` before assuming remote state.

---

## What this project is

**Virallink** (`viral-analytics-hub` repo) is a **B2B URL shortener + click analytics** monorepo aimed at a portfolio / local-dev MVP—not production SaaS yet.

| Piece | Path | Port | Role |
|-------|------|------|------|
| User / identity | `user/` | 8080 | OAuth2 (Google/GitHub), JWT issuance, API key creation |
| Redirect | `redirect/` | 8081 | Hashids short links, **302-first** redirects, async click events to Redis, public URL expander |
| Analytics | `analytics/` | 8082 | Redis Stream consumer (“sponge”), Postgres aggregates, JWT-scoped summary API |
| Frontend | `viral-analytics-hub/` | 3000 | Next.js dashboard, TanStack Query **polling** (~10s), dark UI |
| Infra | `docker-compose.yml` | 5433 / 6379 | Postgres + Redis |

**Core design idea:** redirect path stays fast (302 + fire-and-forget stream write); analytics catches up asynchronously. Dashboard reads pre-aggregated data via polling, not WebSockets.

**Docs to read first:** [README](../README.md), [LOCAL_DEV.md](./LOCAL_DEV.md), [click-events-stream.md](./click-events-stream.md), [CONTRIBUTING](../CONTRIBUTING.md).

---

## What’s done (as of this handover)

### Backend — tenant-scoped analytics (Phase A)

- Click stream key: **`analytics:events`** (not `click_events`) — see stream contract doc.
- Redirect publishes **`userId` + `linkId`** on each click; link metadata cached in Redis hash `link:cache:{shortCode}` (legacy `link:{code}` string migrated on read).
- Analytics persists `user_id` / `link_id` on rows; summary API scoped to authenticated principal.

### Backend — sponge / ops (Phase C)

- `AnalyticsSpongeService`: batch read → `saveAll` → **ACK only after successful persist**; invalid events ACK’d and skipped.
- Config: `analytics.sponge.batch-size`, etc.; Hibernate JDBC batch tuning.
- Docs: `LOCAL_DEV.md`, `click-events-stream.md`, root `.env.example`.

### Frontend — live data (Phase B)

- Removed mock analytics; hooks call real APIs with Bearer token.
- `use-analytics-summary`, `use-links`, `use-poll-clicks-per-second` — 10s poll, `refetchIntervalInBackground: false`.

### Auth pass (user + frontend) — **latest work**

**User service**

- OAuth success → redirect to `{app.frontend.url}/auth/callback?token=…&id=…&email=…&name=…` (`OAuth2LoginSuccessHandler`).
- Default frontend URL: **`http://localhost:3000`** (`app.frontend.url` in `user/.../application.properties`).
- `JwtAuthenticationFilter`: Bearer JWT → principal `Long userId` (same claim shape as redirect/analytics: `userId` claim + email subject).
- `GET /api/v1/users/me`, `GET /api/v1/users/keys`, `POST /api/v1/users/keys` — **JWT only** (not session cookie).
- API key list returns `id`, `prefix`, `createdAt` — **never** the full secret.

**Frontend**

- `/auth/callback` — stores JWT + profile in Zustand (`use-auth-store`, persists **token only**).
- `/settings` — profile, logout, API key create + one-time reveal modal (`use-api-keys`).
- `lib/auth-fetch.ts` — attaches Bearer, **401 → logout → `/login`**.
- Login uses **`/oauth2/authorization/{google|github}`** via Next rewrites (same origin :3000).
- Landing `/` — honest MVP copy (5 sections) + live **UrlExpander**; maps expand API `note` → UI `message`.
- `LinksTable` copy URL uses `NEXT_PUBLIC_REDIRECT_BASE_URL` (default `http://localhost:8081`).
- Build fixes: `calendar.tsx` uses react-day-picker v9 **`Chevron`** component; `vitest.config.ts` excluded from `tsconfig.json` (missing `@vitejs/plugin-react-swc`).

### Tooling / quality

- Root README, CONTRIBUTING, MIT LICENSE, GitHub Actions CI (Gradle matrix + pnpm lint/build).
- Tests: user H2 + test profile; redirect/analytics **Testcontainers Redis** (Docker required).
- redirect: Jackson / compile classpath fix for Spring Boot 4.1-M1.
- Frontend: pnpm hoisted linker (Windows EISDIR fix), Next `output: "standalone"`, React 19.

---

## Auth model (important)

| Use case | Mechanism |
|----------|-----------|
| Human / dashboard | OAuth → JWT in Zustand → `Authorization: Bearer` on redirect + analytics (+ user `/me`) |
| Scripts / automation | `X-API-Key: {prefix}.{hmacSecret}` — validated in redirect/analytics filters (HMAC with `API_KEY_SIGNING_SECRET`) |
| API key creation | `POST /api/v1/users/keys` on **user** service — requires JWT from OAuth flow |

**OAuth redirect URIs** (user service on 8080, not Next):

- Google: `http://localhost:8080/login/oauth2/code/google`
- GitHub: `http://localhost:8080/login/oauth2/code/github`

Next proxies OAuth start URLs: `/oauth2/authorization/*` → 8080 (see `viral-analytics-hub/next.config.ts`).

---

## Environment / secrets (user has not finished GCP setup)

Copy **`.env.example` → `.env`** at repo root (never commit `.env`).

| Variable | From GCP? | Notes |
|----------|-----------|--------|
| `JWT_SECRET` | **No** — generate once (`openssl rand -base64 32`) | **Same value** in user, redirect, analytics |
| `API_KEY_SIGNING_SECRET` | **No** — long random string | **Same value** across three JVM services |
| `HASHIDS_SALT` | No | redirect only |
| `GOOGLE_CLIENT_ID` / `SECRET` | **Yes** — OAuth Web client | Optional until Google sign-in needed |
| `GITHUB_CLIENT_ID` / `SECRET` | GitHub OAuth app | Optional alternative |
| `SAFE_BROWSING_API_KEY` | **Yes** — API key + Safe Browsing API enabled | Optional; redirect expander only |

Frontend optional: `viral-analytics-hub/.env.local` with `NEXT_PUBLIC_REDIRECT_BASE_URL=http://localhost:8081`.

JVM services need **`gradle.properties`** from `gradle.properties.example` (JDK 25 path; on UNC/network drive add `org.gradle.vfs.watch=false`).

---

## What’s left to do (suggested priorities)

### Must-have for real local E2E (owner still owes)

1. Fill `.env`: at minimum `JWT_SECRET`, `API_KEY_SIGNING_SECRET`, `HASHIDS_SALT`.
2. Configure **Google and/or GitHub OAuth** if testing browser login (GCP console ≠ JWT secrets).
3. Smoke test per [LOCAL_DEV.md](./LOCAL_DEV.md): login → create link → hit short URL → Redis stream → dashboard counts.

### Product / engineering gaps

- **API key validation in Redis** (SHA-256 cache) — explicitly **deferred** in `click-events-stream.md`; keys are HMAC self-contained in JWT filters today, hashes stored in Postgres on create only.
- **Link status** — frontend hardcodes `active` (`use-links.ts` TODO).
- **LinksTable UI** still displays `vrl.ink/{code}` in places while copy uses `REDIRECT_BASE_URL` — cosmetic inconsistency.
- **Billing / tiers** — `User.tier` exists; UI always shows FREE.
- **Production deploy** — no K8s/Terraform in repo; Next standalone output is prepared but not wired.
- **CI on Windows/UNC** — Gradle file watching can fail on network paths; document or set `org.gradle.vfs.watch=false`.
- **Vitest** — config excluded from Next typecheck; add `@vitejs/plugin-react-swc` or remove `vitest.config.ts` if tests are wanted in CI.
- **Push to origin** — confirm whether `main` on GitHub has latest commits.

### Nice-to-have

- Refresh token / shorter JWT TTL + silent refresh.
- Revoke/delete API keys endpoint.
- Rate limiting on expander and link creation.
- GeoIP path (`GEOLITE_PATH`) for richer analytics.
- Custom domains, WebSockets, Stripe — **out of scope** per README.

---

## Be careful about

1. **Secret parity** — `JWT_SECRET` and `API_KEY_SIGNING_SECRET` must match across user, redirect, and analytics or auth silently fails (401s).
2. **Port 3000 vs 3001** — user service CORS and OAuth redirect target **3000**; old config used 3001.
3. **Do not commit** `.env`, `gradle.properties`, or raw API keys from Settings UI.
4. **Redirect is hot path** — don’t add blocking DB/analytics work on 302 path; stream publish is async.
5. **Stream ACK semantics** — ACK means “processed by sponge,” not “deleted from stream history”; see prior user education on PEL/ACK in transcript if debugging consumer lag.
6. **Tests need Docker** for redirect/analytics `gradlew build` (Testcontainers Redis).
7. **Spring Boot 4.1-M1** — early milestone; dependency quirks (e.g. redirect needed explicit Jackson starter).
8. **PowerShell** — use `;` not `&&` between commands on Windows.
9. **pnpm** in `viral-analytics-hub` — use project `.npmrc` (hoisted linker); run install from that directory.
10. **OAuth vs API keys** — login is for humans; API keys are for machines. Don’t expose key creation without JWT.
11. **Honest marketing** — landing page was deliberately toned down; avoid re-adding enterprise/SSO/custom-domain claims unless implemented.

---

## Key files (auth pass)

| Area | Files |
|------|--------|
| OAuth → JWT | `user/.../OAuth2LoginSuccessHandler.java`, `SecurityConfig.java` |
| JWT filter (user) | `user/.../JwtAuthenticationFilter.java` |
| User API | `user/.../UserController.java`, `UserService.java` |
| JWT filter (redirect/analytics) | `redirect/.../JwtAuthenticationFilter.java` (also validates `X-API-Key`) |
| Frontend auth | `viral-analytics-hub/src/hooks/use-auth-store.ts`, `use-user.ts`, `lib/auth-fetch.ts`, `app/auth/callback/page.tsx`, `app/settings/page.tsx` |
| BFF proxies | `viral-analytics-hub/next.config.ts` |

---

## Commands cheat sheet

```powershell
docker compose up -d
# Terminal 1–3: user, redirect, analytics — .\gradlew.bat bootRun
cd viral-analytics-hub; pnpm install; pnpm run dev    # :3000
pnpm run build   # should pass after calendar + tsconfig fixes
```

```powershell
cd user; .\gradlew.bat build      # user tests: H2, no Testcontainers
cd redirect; .\gradlew.bat build  # needs Docker
cd analytics; .\gradlew.bat build # needs Docker
```

---

## Conversation / transcript

Extended context (planning, PEL/ACK/HMAC explanations, commit splits):  
agent transcript `b41ca925-a315-4d4f-beb8-4869fb9fe926` under the Cursor project’s `agent-transcripts/` folder.

---

## Git / commit etiquette (owner preference)

- **Only commit when asked** — user prefers explicit request before commits.
- Recent style: `feat(service): …`, `docs: …`, `fix(redirect): …`.
- Do not force-push `main`; do not commit secrets.
