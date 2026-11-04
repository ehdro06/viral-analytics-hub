# 2026-11-04 — local baseline

**Setup:** redirect + analytics (prod profile, `SPONGE_MODE=on-demand`) on one 4-CPU container with local
PostgreSQL 16 and Redis 7; k6 v1.0.0 on the same machine (shares the CPUs). 10 links.
`k6 run -e BASE_URL=http://127.0.0.1:9081 -e CODES=... -e PEAK_RPS=1000 -e STEP_SECS=30 loadtest/redirect.js`
Ramp: 100 -> 250 -> 500 -> 1,000 req/s, 30 s per step. Drain called once a minute, like Cloud Scheduler.

| Metric | Result |
|---|---|
| Requests | 74,004 (avg 435 req/s over the run, peak 1,000 req/s) |
| Errors | 0 % |
| Latency | median 0.90 ms, p90 1.47 ms, p95 1.95 ms, p99 5.98 ms, max 177 ms |
| Clicks stored after draining | 74,004 of 74,004 |

Files: [`report.html`](report.html) (graphs, download to view), [`summary.json`](summary.json) (raw k6 numbers),
[`drains.txt`](drains.txt) (backlog before each once-a-minute drain and how many events it processed).

## What we learned

- The code is not the limit at 1,000 req/s: a redirect is a Redis read plus a queued event, about 1 ms.
- **Every click arrived** (ack-after-insert works under load).
- **Bottleneck found:** `drains.txt` shows each drain stopping at exactly 10,000 events while the backlog grew to
  55,663; clearing it took 7 minutes. In production (one drain per minute) that meant ~167 clicks/s sustained at most,
  and a backlog above the 500,000 stream cap would lose clicks.
- **Fixed in #16** (drain until empty, 50 s budget). Re-run of the same test with the fix: one drain call stored all
  74,004 clicks in 19.4 s; redirect numbers unchanged (p95 2.0 ms, 0 errors). No HTML report was exported for that run.

Caveat: local numbers show what the code can do, not the production setup (free-tier Redis VM, Cloud Run limits,
Neon over the network).
