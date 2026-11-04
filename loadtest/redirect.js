// k6 load test for the redirect hot path: GET /<code> -> 302.
//
//   k6 run -e BASE_URL=https://redirect-xxx.run.app -e CODES=aB3dEf,x9Kq2L loadtest/redirect.js
//
// Options (all -e NAME=value):
//   BASE_URL   redirect service URL, no trailing slash (required). Test the service directly, not through Vercel.
//   CODES      comma-separated short codes of existing, active links (required). Use links made for the test.
//   PEAK_RPS   highest request rate to reach (default 200)
//   STEP_SECS  seconds to hold each step (default 60)
//   P95_MS     pass/fail threshold for p95 latency of redirects (default 200)
//
// The ramp goes 10% -> 25% -> 50% -> 100% of PEAK_RPS, holding each step, so the results show where latency or
// errors start to climb. The summary prints `clicks_sent` (302 answers): every one of them should end up in the
// analytics database once the queue has drained. See docs/LOAD_TEST.md for how to check that.
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL;
const CODES = (__ENV.CODES || '').split(',').map((c) => c.trim()).filter(Boolean);
const PEAK = Number(__ENV.PEAK_RPS || 200);
const STEP = `${Number(__ENV.STEP_SECS || 60)}s`;
const P95 = Number(__ENV.P95_MS || 200);

if (!BASE_URL || CODES.length === 0) {
  throw new Error('Set BASE_URL and CODES, e.g. -e BASE_URL=https://... -e CODES=abc123,def456');
}

const clicksSent = new Counter('clicks_sent');

const step = (fraction) => [
  { target: Math.max(1, Math.round(PEAK * fraction)), duration: '10s' }, // ramp to the step
  { target: Math.max(1, Math.round(PEAK * fraction)), duration: STEP }, // hold it
];

export const options = {
  discardResponseBodies: true,
  scenarios: {
    redirects: {
      // Arrival rate, not virtual users: requests keep coming at the target rate even when the server slows down,
      // like real visitors do. (A fixed number of looping users would politely wait and hide the slowdown.)
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: Math.max(50, PEAK),
      maxVUs: Math.max(200, PEAK * 4),
      stages: [...step(0.1), ...step(0.25), ...step(0.5), ...step(1), { target: 0, duration: '10s' }],
    },
  },
  thresholds: {
    'http_req_failed': ['rate<0.01'],
    'http_req_duration{expected_response:true}': [`p(95)<${P95}`],
    'checks': ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const code = CODES[Math.floor(Math.random() * CODES.length)];
  // redirects: 0 -> measure our 302 only, never the destination site
  const res = http.get(`${BASE_URL}/${code}`, {
    redirects: 0,
    tags: { name: 'redirect' },
    responseCallback: http.expectedStatuses(302),
  });
  if (check(res, { 'is 302': (r) => r.status === 302 })) clicksSent.add(1);
}
