# Click events Redis stream

## Stream key

| Constant | Value | Notes |
|----------|-------|--------|
| `ClickEventStreamFields.STREAM_KEY` | `analytics:events` | Canonical name in redirect + analytics code |

Early specs used `click_events`; the implementation standardizes on **`analytics:events`** to avoid a breaking migration. Rename only with a dual-read/dual-write cutover.

## Producer

- **Service:** `redirect`
- **Class:** `com.virallink.redirect.service.AnalyticsService` (`@Async` after link resolve)
- **Also:** Redis counter `stats:link:{shortCode}:clicks`

## Consumer

- **Service:** `analytics`
- **Class:** `com.virallink.analytics.service.AnalyticsSpongeService`
- **Group:** `analytics-group`
- **Consumer:** `analytics-sponge-1`
- **Behavior:** Read batch → `saveAll` → **ACK only after successful persist**; invalid entries (no `shortCode`) are ACK'd and dropped with a warning

## Entry fields

| Field | Required | Description |
|-------|----------|-------------|
| `userId` | Yes (new events) | Link owner for tenant-scoped analytics |
| `linkId` | Yes (new events) | `links.id` in redirect DB |
| `shortCode` | Yes | Public short code; sponge skips + ACK if missing |
| `ip` | Yes | Anonymized IP from redirect |
| `ua` | No | User-Agent |
| `ref` | No | Referer or `direct` |
| `timestamp` | Yes | ISO-8601 instant |

Keep `redirect` and `analytics` `ClickEventStreamFields` classes in sync.

## API keys (MVP)

Programmatic keys use **`prefix.secret`** with a shared **`api.key.signing-secret`** (HMAC). Validated in redirect/analytics JWT filters without a Redis lookup.

Phase 1 **Redis SHA-256 cache** validation is deferred; document any change in this file and in `docs/LOCAL_DEV.md`.
