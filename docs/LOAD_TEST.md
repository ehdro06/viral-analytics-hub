# Load testing the redirect hot path

What we measure: how many short-link clicks per second the redirect service answers, how fast (p95/p99), with how
many errors, and whether **every** click still ends up in the analytics database afterwards.
Tool: [k6](https://k6.io) (open source, no account). Script: [`loadtest/redirect.js`](../loadtest/redirect.js).

The numbers describe **this setup** (free-tier VM for Redis, Cloud Run limits, Neon free tier). They are a ceiling and
a bottleneck for these choices, not a promise of how far the design scales.

## Results so far

### Local baseline (Nov 2026)

Redirect + analytics with the prod profile on one 4-CPU container, local Postgres 16 and Redis 7, k6 on the same
machine (so the services and k6 share CPUs). 10 links, ramp 100 -> 250 -> 500 -> 1,000 req/s, 30 s per step.

| Metric | Result |
|---|---|
| Requests | 74,004 (peak 1,000 req/s) |
| Errors | 0 % |
| Latency | median 0.9 ms, p95 1.95 ms, p99 6.0 ms, max 177 ms |
| Clicks stored after draining | 74,004 of 74,004 (no loss) |

What this shows: the code itself is not the limit at 1,000 req/s; the redirect answers from the Redis cache in about a
millisecond and hands the click to the queue.

**Finding (fixed): the drain was capped at 10,000 clicks per call.** Each `POST /internal/sponge/drain` processed at
most 20 batches of 500, so with Cloud Scheduler calling once a minute production could absorb on average only
**~167 clicks/s**. In the first run the backlog reached 55,663 and took 7 minutes to clear; a backlog above the stream
cap (500,000) would have lost the oldest clicks. One batch of 10,000 took ~2 s, so the cap was a setting, not a limit.

Fix: an on-demand drain now keeps going until the stream is empty or its time budget runs out
(`SPONGE_DRAIN_BUDGET_SECONDS`, default 50, well under the scheduler's 120 s deadline). The 500 ms local polling
tick keeps its 20-batch bound. Same test again: **one drain call stored all 74,004 clicks in 19.4 s** (~3,800/s
locally; expect less on Cloud Run + Neon).

### Production

Not run yet. Follow the steps below and fill in the same table.

## Before you start (production)

1. **Budget alert** set (Billing -> Budgets & alerts). One test of a few minutes is roughly 100,000-300,000 requests;
   Cloud Run's free tier covers ~2 million requests a month.
2. **Know the caps:** `gcloud run services describe redirect --region=us-west1 --format='value(spec.template.metadata.annotations)'`
   shows `autoscaling.knative.dev/maxScale` (max instances). That caps throughput; write it down with the results.
3. **Test links:** in the dashboard create about 5 links pointing at harmless pages (e.g. `https://example.com/1`) and
   copy their short codes (the part after the last `/`).
4. **Write down the dashboard's total clicks** for those links (or your account) before the test.
5. Pick a quiet time: during the test the live site is slower for everyone.

## Run it from a VM next to the services

From a laptop or phone in Korea most of the measured time would be the trip across the Pacific. A temporary VM in the
same region measures the service. Run in **Cloud Shell**:

```bash
gcloud config set project virallink-487806
cd ~/viral-analytics-hub && git pull

# Temporary load generator in the same region (e2-standard-2 is about $0.07 an hour; delete it afterwards)
gcloud compute instances create k6-runner --zone=us-west1-b --machine-type=e2-standard-2 \
  --image-family=debian-12 --image-project=debian-cloud
gcloud compute scp loadtest/redirect.js k6-runner:~ --zone=us-west1-b
gcloud compute ssh k6-runner --zone=us-west1-b
```

Inside the VM:

```bash
curl -sSLO https://github.com/grafana/k6/releases/download/v1.0.0/k6-v1.0.0-linux-amd64.tar.gz
tar xzf k6-v1.0.0-linux-amd64.tar.gz && sudo mv k6-v1.0.0-linux-amd64/k6 /usr/local/bin/

# Start gentle: peak 200 req/s, 60 s per step (about 5 minutes)
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=report-200.html K6_WEB_DASHBOARD_PORT=-1 \
  k6 run -e BASE_URL=https://redirect-85302724166.us-west1.run.app -e CODES=code1,code2,code3 \
  -e PEAK_RPS=200 redirect.js
```

If that passes, repeat with `PEAK_RPS=500`, then `1000`, changing the report name each time. Stop raising it when
errors appear or p95 jumps: that step is the ceiling.

Bring the reports back and delete the VM:

```bash
exit                                                     # leave the VM
gcloud compute scp 'k6-runner:~/report-*.html' . --zone=us-west1-b
cloudshell download report-200.html                      # once per file; opens a browser download
gcloud compute instances delete k6-runner --zone=us-west1-b --quiet
```

## Reading the results

- **k6 summary** (printed at the end): `http_reqs` (total and per second), `http_req_duration` p95/p99,
  `http_req_failed`, and `clicks_sent`. A ✓/✗ next to each threshold says pass or fail (defaults: under 1 % errors,
  p95 under 200 ms; change with `-e P95_MS=...`).
- **HTML report** (`report-*.html`, open in a browser): latency, request rate and errors over time. Look for the
  moment the curves bend.
- **Google Cloud console**, for the same time window:
  - Cloud Run -> redirect -> Metrics: request count, latency, **container instance count**, CPU. The first seconds
    include cold starts while new instances start; that is expected.
  - Compute Engine -> `virallink-redis` -> Observability: CPU. A tiny shared-core VM pinned at 100 % means Redis is
    the bottleneck.
  - Neon dashboard: connections and CPU (only cache misses reach Postgres).
- **No lost clicks:** wait for the next drain (the backlog is cleared in one call if it fits in the time budget), then the dashboard's click total should have grown by exactly `clicks_sent`.

## What to write down

Date, max instances, peak req/s that passed, p95/p99 at that rate, error rate, which part hit its limit first, how
long the backlog took to drain, clicks sent vs stored. That is the sentence for the README and interviews:
"On the free-tier setup the redirect held X req/s at p95 Y ms with 0 lost clicks; the first bottleneck was Z."
