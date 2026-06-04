# Local development

Overview and architecture: [README](../README.md). Contribution guidelines: [CONTRIBUTING](../CONTRIBUTING.md).

## Infrastructure

```bash
docker compose up -d
```

- **PostgreSQL:** `localhost:5433` (databases: `virallink_user`, `virallink_redirect`, `virallink_analytics`)
- **Redis:** `localhost:6379`

## Environment variables

Copy `.env.example` to `.env` in the repo root (or export in your shell). All three JVM services and the Next.js app need consistent secrets where noted.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | user, redirect, analytics | Base64 HMAC key for Bearer JWT |
| `API_KEY_SIGNING_SECRET` | user, redirect, analytics | HMAC for `prefix.secret` API keys |
| `HASHIDS_SALT` | redirect | Short-code generation |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | user | OAuth (optional for local) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | user | OAuth (optional for local) |
| `SAFE_BROWSING_API_KEY` | redirect | Google Safe Browsing (optional) |

Generate a JWT secret (example):

```bash
openssl rand -base64 32
```

## Java services

Per service (`user`, `redirect`, `analytics`):

1. Copy `gradle.properties.example` → `gradle.properties` and set `org.gradle.java.home` to your **JDK 25 root** (folder that contains `bin/`).
2. Optional on network shares: `org.gradle.vfs.watch=false`

```powershell
cd user    # or redirect / analytics
.\gradlew.bat build
```

**Tests:** redirect and analytics integration tests start **Redis via Testcontainers** — Docker must be running.

| Service | Port |
|---------|------|
| user | 8080 |
| redirect | 8081 |
| analytics | 8082 |

## Frontend

```powershell
cd viral-analytics-hub
pnpm install
pnpm run dev
```

Rewrites in `next.config.ts` proxy `/api/v1/*` to the JVM ports above.

## Click pipeline smoke test

1. Start infra + user + redirect + analytics + frontend.
2. Log in, create a link, open the short URL in a private window.
3. Confirm Redis: `XLEN analytics:events` increases.
4. Wait for sponge poll (~1s) or check `link_analytics` rows with your `user_id`.
5. Dashboard/analytics summary should reflect scoped counts for that user only.

See [click-events-stream.md](./click-events-stream.md) for stream contract details.
