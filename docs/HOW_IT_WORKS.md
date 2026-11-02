# How ViralLink works (a walkthrough you can explain out loud)

Goal of this page: after reading it you can draw the system on a whiteboard and answer "why did you do it that way?"
Read one journey at a time, then try the **Look inside** commands. Seeing the data with your own eyes is what makes it stick.

## The big picture

Four programs, two databases, one browser app:

```
Browser (Next.js, :3000)
   |  every request goes to the Next.js origin, which forwards ("rewrites") it:
   |-- /api/v1/users/me, /oauth2/*  --> user service      :8080  (who are you?)
   |-- /api/v1/links                --> redirect service  :8081  (make / list / pause / delete links)
   |-- /api/v1/analytics/*          --> analytics service :8082  (charts)
   '-- short link click  (GET /aB3dEf) ---------------> redirect service :8081

Postgres  = the permanent record (users, links, clicks)
Redis     = the fast scratchpad (link cache, click counters, a queue of click events)
```

In production the same picture runs on Vercel (Next.js), Cloud Run (the three services), Neon (Postgres) and a small
private Redis VM; [DEPLOY.md](./DEPLOY.md) has the details.

The design idea: **a click must be answered in milliseconds**, even if a link goes viral. So the redirect service never
does slow work while the visitor waits. It answers from memory (Redis), then hands the "record this click" job to a queue
and moves on. Another service empties the queue later, at its own pace.

---

## Journey 1: signing in

1. You click "Sign in with Google" on the login page. Locally that is a plain link to the **user service** (`:8080/oauth2/authorization/google`).
   In production the link points at the Vercel site instead, and Vercel forwards it (see "Why login goes through Vercel" below).
2. The user service sends you to Google. You approve there. Google sends your browser back to the **redirect URI**
   (`/login/oauth2/code/google`) with a one-time code. Google only sends it to URLs you registered, so nobody else can catch it.
3. The user service swaps the code for your profile, saves or updates you in Postgres
   ([CustomOidcUserService](../user/src/main/java/com/virallink/user/service/CustomOidcUserService.java)), and gives your browser a **session cookie**. The session behind that cookie is stored **in Redis** (Spring Session), not inside the
   service's memory, so restarting the user service, or a second copy of it answering, does not log you out.
4. The frontend calls `GET /api/v1/users/me`. The cookie proves who you are, and the answer includes a **JWT**
   ([UserController](../user/src/main/java/com/virallink/user/controller/UserController.java),
   [JwtService](../user/src/main/java/com/virallink/user/service/JwtService.java)).
5. The frontend keeps the JWT in memory and sends it as `Authorization: Bearer ...` to the other two services.

**What is a JWT?** A signed note: "this is user 7, valid for the next hour." It is signed with a secret (`JWT_SECRET`) that
all three services share. The redirect and analytics services do not call the user service to check you; they just verify
the signature ([JwtAuthenticationFilter](../redirect/src/main/java/com/virallink/redirect/config/JwtAuthenticationFilter.java)).
Anyone can read a JWT, but nobody can change it without the secret.

A JWT lives one hour. When a call comes back 401, [authFetch](../viral-analytics-hub/src/lib/auth-fetch.ts) quietly asks
`/api/v1/users/me` for a fresh one (the session cookie still proves who you are) and repeats the call once, so you
are not logged out mid-work. Every call also gives up after 30 seconds instead of hanging forever.

Why both a cookie and a JWT? The cookie is for the user service (browser login). The JWT is for the other services, so they
stay independent of it.

**Why login goes through Vercel in production.** A browser keeps cookies per site and only sends them back to the site that set
them. If the login link went straight to the user service (`user-xxx.run.app`), the cookie would be saved for `run.app`, and the
dashboard on `yourapp.vercel.app` asking `/api/v1/users/me` would carry no cookie: an endless "not logged in" loop. So in
production the link is `yourapp.vercel.app/oauth2/...` (`NEXT_PUBLIC_API_BASE_URL` = the Vercel URL), Next.js forwards it to the
user service (the `rewrites` in `next.config.ts`), and the browser only ever talks to `vercel.app`, so the cookie lands there.
Google is told to send you back to `yourapp.vercel.app/login/oauth2/code/...` for the same reason. Locally none of this matters:
`localhost:8080` and `localhost:3000` count as the same site for cookies (ports are ignored).

---

## Journey 2: creating a short link

`POST /api/v1/links` with `{"longUrl": "https://example.com/page"}` -> [LinkService.createLink](../redirect/src/main/java/com/virallink/redirect/service/LinkService.java)

1. **Who is asking?** The JWT filter reads the user id from the token. The user id never comes from the request body,
   so a user cannot create links "as" someone else.
2. **Is the URL acceptable?** http/https only, has a host, not too long, no `user:password@`. Then an optional Google Safe Browsing check.
3. **Save the row** in Postgres. It gets an auto-number id (say 1042).
4. **Turn the id into a short code.** [Hashids](https://hashids.org/) converts 1042 into something like `aB3dEf`. The codes are
   unique for free (every id is unique), and no random-collision retry loop is needed. They look random but are **not secret**:
   they are just an id in disguise, shuffled with `HASHIDS_SALT`.
5. **Warm the cache**: store the link in Redis so the very first click is fast.

Two details worth knowing:
- The row is first saved with a unique placeholder code, because the real code needs the id, which only exists after the insert.
  A shared placeholder (an empty string) would make two simultaneous creates fight over the unique index. That was a real bug.
- The slow safety check happens *before* the database transaction starts, so we never hold a DB connection while waiting on Google.
- **Rate limits** stop one account from creating thousands of links (20 per minute, 500 per day): a Redis counter per
  user and time window (`INCR` + expiry). Over the limit the answer is 429 with `Retry-After`. If Redis is down the
  limit is skipped (fail-open): better to allow a few extra links than to block everyone.

The owner can later **pause** a link or give it an **expiry date** (`PATCH /api/v1/links/{id}`). Both are stored on the
row and in the cache entry.

---

## Journey 3: someone clicks the short link (the "hot path")

`GET /aB3dEf` -> [RedirectController](../redirect/src/main/java/com/virallink/redirect/controller/RedirectController.java) -> `LinkService.resolveLink`

```
code looks valid? --no--> 404 (nothing else touched)
      |yes
Redis has it?   --yes--> 302 redirect  (no database involved)
      |no
Postgres has it? --no--> remember "missing" for 60s -> 404
      |yes
put in Redis (10 min) -> paused or expired? --yes--> 410 "no longer active" page
                                 |no
                           302 redirect
```

This pattern is called **cache-aside**: look in the fast place first; on a miss, ask the slow source of truth and fill the fast place.

- **Valid-looking check**: the code is decoded and re-encoded with Hashids. Random junk like `/wp-admin` fails instantly, so bots
  cannot make us hit the database or flood the analytics queue.
- **TTL** (time to live): a cache entry disappears after 10 minutes. Popular links get re-filled constantly; forgotten ones drop out.
- **Negative caching**: "this code does not exist" is cached for 60s, so a burst of requests for a deleted link asks Postgres once, not 10,000 times.
- **Redis is optional, not required**: if Redis is down or slow, [LinkCache](../redirect/src/main/java/com/virallink/redirect/service/LinkCache.java) reports
  "unknown" and we read Postgres. Redirects get slower, but they keep working. (I tested this by stopping Redis.)
- The cached value holds the URL **and the owner's user id**, so we can credit the click without a database call.

After the redirect decision, `AnalyticsService.trackClick` runs **asynchronously** (a separate lightweight virtual thread), so the visitor
does not wait for it. It does two things
([AnalyticsService](../redirect/src/main/java/com/virallink/redirect/service/AnalyticsService.java)):
1. `INCR` a counter in Redis, which is what the links table shows.
2. `XADD` an event onto a Redis **stream** (a queue that keeps its items until someone confirms them): short code, owner,
   the visitor's **anonymised IP**, browser string, referrer, timestamp.

**IP anonymisation (GDPR)**: [IpAnonymizer](../redirect/src/main/java/com/virallink/redirect/util/IpAnonymizer.java) zeroes the last part of the
address (`203.0.113.42` -> `203.0.113.0`) *before* it goes anywhere. We never store the real one.

---

## Journey 4: the click becomes a chart

The **analytics service** empties the queue with [AnalyticsSpongeService](../analytics/src/main/java/com/virallink/analytics/service/AnalyticsSpongeService.java).
Locally it polls every half second. In production it would then have to run all the time (and cost money), so instead
it sleeps and **Cloud Scheduler wakes it once a minute** with `POST /internal/sponge/drain`
([SpongeTriggerController](../analytics/src/main/java/com/virallink/analytics/controller/SpongeTriggerController.java)); it empties
the queue and goes back to zero instances. The price: charts lag by up to a minute. Each drain:

1. Read up to 500 events from the stream. The service is a **consumer** in a **consumer group**: Redis remembers what it has already been given.
2. Turn each event into a row: parse the browser string (Chrome / Windows), look up the country from the anonymised IP in the local
   GeoLite2 file, keep only the referrer's host (`twitter.com`).
3. Insert all rows in **one batch** (one round trip instead of 500).
4. Only **after** the insert succeeds: acknowledge (`XACK`) and delete the events from the stream.

Step 4 is the important trick. If Postgres is down or the service crashes at step 3, the events were never acknowledged, so they are
still waiting and get retried. That is called **at-least-once delivery**: nothing is lost, and in a rare crash a click might be counted twice.
A malformed event is logged and dropped so one bad message cannot block the queue forever.

The dashboard calls `GET /api/v1/analytics/summary` every 10 seconds. The analytics service reads the user id from the JWT and every SQL query
has `WHERE owner_id = ?`. This is **tenant isolation**: user A can never see user B's clicks, because the id comes from the verified token and not from anything the browser sends.
([AnalyticsSummaryService](../analytics/src/main/java/com/virallink/analytics/service/AnalyticsSummaryService.java))

---

## Journey 5: deleting your account (privacy)

Settings → Delete account, after typing `DELETE` ([use-delete-account.ts](../viral-analytics-hub/src/hooks/use-delete-account.ts)):

1. `DELETE /api/v1/links` → redirect deletes your links, their cache entries and click counters.
2. `DELETE /api/v1/analytics/me` → analytics deletes the click records of your links.
3. `DELETE /api/v1/users/me` → user deletes your API keys and account, then ends the session.

The account goes **last** because steps 1 and 2 still need you to be logged in. Each step can safely run twice, so if
one fails, trying again finishes the job.

The tricky part: your JWT (and any API key) is a signed note the other services check **without asking anyone**. Deleting
the account does not make it stop verifying. So before deleting, the user service writes `auth:deleted-user:{id}` into
Redis, and redirect and analytics refuse tokens of that user from then on
([UserService.deleteAccount](../user/src/main/java/com/virallink/user/service/UserService.java)). The key is written
*first*: if Redis is down, nothing is deleted, rather than deleting an account whose tokens keep working.

Separately, analytics deletes click records older than 12 months once a day
([RetentionService](../analytics/src/main/java/com/virallink/analytics/service/RetentionService.java)), which is what the
[Privacy Policy](https://vilnk.vercel.app/privacy) promises. "Storage limitation" is a GDPR principle: keep data only as long as you need it.

---

## Look inside (do these!)

Start Docker, the three services and one or two clicks first. Then:

```bash
# 1. The cached link: a Redis hash with the url and the owner, and how long it will live
docker exec virallink-redis redis-cli hgetall link:<yourcode>
docker exec virallink-redis redis-cli ttl link:<yourcode>

# 2. The click counter and the queue
docker exec virallink-redis redis-cli get stats:link:<yourcode>:clicks
docker exec virallink-redis redis-cli xlen analytics:events        # 0 when the sponge has caught up

# 3. The stored clicks (note ip_address is anonymised, referer is just a host)
docker exec virallink-postgres psql -U postgres -d virallink_analytics \
  -c "select short_code, owner_id, clicked_at, ip_address, referer, country, browser from link_analytics order by id desc limit 5"

# 4. Watch the negative cache: hit a code that does not exist, then look for it
curl -i localhost:8081/doesnotexist          # 404, and nothing appears in Redis: it failed the "looks valid" check
```

## Check yourself

Try answering out loud before looking anything up.

1. Why does the redirect service answer from Redis and queue the click instead of writing the click to Postgres directly?
2. A link is deleted, but someone still has the short URL. Walk through exactly what happens on their next click.
3. What could go wrong if the short code were a random string instead of derived from the database id? (Think: collisions, retries.)
4. Why is the user id taken from the JWT and never from the request body or the URL?
5. The analytics service crashes halfway through writing a batch. Are clicks lost? Why or why not?
6. Why is the IP anonymised in the redirect service and not later in the analytics service?
7. Redis goes down. What still works, what gets slower, and what is lost?
8. Why does the create-link code run the Google Safe Browsing check *before* the database transaction?
9. A user deletes their account but still has a valid JWT in another tab. Why doesn't it keep working for the rest of the hour?

<details>
<summary>Answers (look after you tried)</summary>

1. A database write per click is slow and can become the bottleneck during a spike; memory lookups plus a queue keep the visitor's wait tiny and let the database be written in efficient batches.
2. The delete removed the row and the cache entry. The click fails the cache lookup, misses Postgres, gets remembered as "missing" for 60s and returns 404. No click is recorded for a link that does not exist.
3. Two links could get the same code, needing a check-and-retry on every create, and races under load. Ids are unique by construction.
4. Anything from the browser can be forged. The JWT is signed, so its contents can be trusted; that stops one user acting on, or reading, another user's data.
5. No. Events are acknowledged only after the insert commits. Unacknowledged ones stay pending and are retried. Worst case a click is counted twice.
6. So the raw IP never leaves the first service, is never on the queue and never touches a disk. Fewer places to leak, and easier to prove compliance.
7. Redirects still work (from Postgres, a bit slower because of the timeouts). New clicks are not counted or queued while it is down, and the cache is empty when it returns. That is the price of Redis being a cache, not the source of truth.
8. A transaction holds a database connection. Waiting on a slow external call inside it would tie up connections and make the whole service slower under load.
9. Deletion writes `auth:deleted-user:{id}` to Redis first; redirect and analytics check it on every request and refuse that user's tokens.
</details>

## Try changing one thing yourself

Small, safe, and each one proves you understand a piece:

- Change the cache TTL from 10 minutes to 1 minute in `LinkCache`, restart, create a link, and watch `ttl` count down in Redis.
- Change `hashids.min-length` to 8 and create a link: the code gets longer. What happens to the old links? (Try it.)
- Make the analytics summary also return the number of distinct countries. (Touch: repository query -> summary service -> DTO.)

## What is deliberately not done yet

- No API gateway (the Next.js rewrites stand in) and no circuit breaker. When Redis is down every request waits out a timeout.
- No load test, so the "10k requests/second" goal is unproven.
- The link table's click count comes from Redis counters, which reset if Redis is wiped; the analytics database is the durable record.
- API keys cannot be revoked one by one yet (they are self-verifying); only deleting the account blocks them.
- No country/city in production until the GeoLite2 file is uploaded.
