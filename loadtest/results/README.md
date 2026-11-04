# Load test results

One folder per run: `YYYY-MM-DD-<where>`. Each holds the k6 HTML report (`report.html`), the raw k6 summary
(`summary.json`) and a `README.md` with the setup and what we learned. How to run a test: [docs/LOAD_TEST.md](../../docs/LOAD_TEST.md).

**Viewing a report:** GitHub shows HTML files as source code. Open the file, click **Download raw file**, then open
it in a browser (it is a single self-contained file, works offline).

| Run | Where | Peak | p95 | Errors | Clicks lost | Notes |
|---|---|---|---|---|---|---|
| [2026-11-04-local](2026-11-04-local/) | local container, prod profile | 1,000 req/s | 1.95 ms | 0 % | 0 of 74,004 | found the 10,000-per-drain cap (fixed in #16) |
