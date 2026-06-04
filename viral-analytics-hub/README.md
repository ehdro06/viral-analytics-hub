# Virallink frontend

Next.js dashboard for the Virallink monorepo.

**Documentation, architecture, and local setup:** see the [repository root README](../README.md) and [docs/LOCAL_DEV.md](../docs/LOCAL_DEV.md).

## Commands

```bash
pnpm install
pnpm run dev      # http://localhost:3000
pnpm run build
pnpm run lint
```

API routes are proxied to Spring Boot services via `next.config.ts` (user `8080`, redirect `8081`, analytics `8082`).
