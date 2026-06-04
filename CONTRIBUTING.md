# Contributing

Thanks for your interest in Virallink. This project is an MVP monorepo aimed at a clear local-dev story and honest scope on the README.

## Before you open a PR

1. Read **[docs/LOCAL_DEV.md](docs/LOCAL_DEV.md)** for infrastructure, env vars, and a click-pipeline smoke test.
2. Copy **`.env.example`** → **`.env`** at the repo root (never commit `.env`).
3. Per JVM service (`user`, `redirect`, `analytics`), copy **`gradle.properties.example`** → **`gradle.properties`** and set `org.gradle.java.home` to your JDK 25 install root (the folder that contains `bin/`).

## Build & test locally

```bash
docker compose up -d

cd user && ./gradlew build
cd redirect && ./gradlew build
cd analytics && ./gradlew build   # requires Docker for Redis Testcontainers

cd viral-analytics-hub && pnpm install && pnpm run lint && pnpm run build
```

CI runs the same Gradle and pnpm steps on `main` and pull requests (see `.github/workflows/ci.yml`).

## Code conventions

- Keep stream field names in sync: `ClickEventStreamFields` in **redirect** and **analytics**.
- Redirect hot path must not block on analytics (async stream publish).
- Analytics queries must remain scoped by authenticated `userId` unless explicitly building an admin API.
- Prefer small, focused commits; match existing package layout (`com.virallink.*`).

## Questions

Open a GitHub issue for bugs or design questions. For security-sensitive findings, avoid posting secrets in issues.
