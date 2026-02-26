# Redirect Service — ViralLink

The core engine of the ViralLink platform. Responsible for three things:

1. **Hot-path redirect resolution** — decodes a short code and issues a `302` redirect to the original URL with sub-millisecond latency using a Redis L1 cache.
2. **Link management** — authenticated CRUD for creating, listing, and deleting short links.
3. **URL Expander (public utility)** — expands any short/tracked URL, reveals the full redirect chain, and checks the final destination against Google Safe Browsing.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Java 25 · Virtual Threads (`spring.threads.virtual.enabled=true`) |
| Framework | Spring Boot 4 (WebMVC, Data JPA, Security, Actuator) |
| Database | PostgreSQL 16 (persistent link store) |
| Cache | Redis 7 (L1 hot-path cache, 10-minute TTL) |
| Short Code | [Hashids](https://hashids.org/java/) — encodes the auto-increment DB ID into a Base62-style code |
| Auth | Stateless JWT via `JwtAuthenticationFilter` |
| Safety | Google Safe Browsing API v4 (threat match) |

---

## Architecture

```
Client
  │
  ├─ GET /{shortCode}           → RedirectController
  │       │                           └── LinkService
  │       │                                 ├── Redis (L1 cache hit → instant 302)
  │       │                                 └── PostgreSQL (cache miss → hydrate Redis → 302)
  │       └── Analytics event fired async (IP, UA, Referrer)
  │
  ├─ POST /api/v1/links         → RedirectController (JWT protected)
  │       └── LinkService.createLink()
  │             ├── Save to PostgreSQL (gets DB ID)
  │             ├── Hashids.encode(id) → shortCode
  │             └── Hydrate Redis
  │
  └─ GET /api/expand?url=...    → ExpandController (public)
          └── UrlExpandService.expand()
                ├── Follow up to 5 redirects (HEAD, fallback GET)
                ├── SSRF guard (blocks private/loopback/link-local IPs)
                └── UrlExpandService.checkSafeBrowsing()
                      └── Google Safe Browsing API v4 → sets `safe` flag
```

---

## API Endpoints

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/{shortCode}` | Resolve and redirect a short link |
| `GET` | `/api/expand?url={url}` | Expand a URL and check its safety |

**Expand response example:**
```json
{
  "inputUrl": "https://bit.ly/example",
  "finalUrl": "https://example.com/very/long/path",
  "shortened": true,
  "safe": true,
  "note": null,
  "hops": [
    { "url": "https://bit.ly/example", "status": 301, "location": "https://example.com/very/long/path" },
    { "url": "https://example.com/very/long/path", "status": 200, "location": null }
  ]
}
```

If the destination is flagged, `safe` will be `false` and `note` will read `"Flagged by Google Safe Browsing"`.

### Authenticated (Bearer JWT required)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/links` | Create a short link |
| `GET` | `/api/v1/links` | List all links for the current user |
| `DELETE` | `/api/v1/links/{id}` | Delete a link (ownership enforced) |

---

## Configuration

Copy the values below into `src/main/resources/application.properties` or supply them as environment variables.

```properties
# Server
server.port=8081

# Database
spring.datasource.url=jdbc:postgresql://localhost:5433/virallink_redirect
spring.datasource.username=postgres
spring.datasource.password=postgres

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379

# Hashids — change the salt in production!
hashids.salt=${HASHIDS_SALT}
hashids.min-length=6

# JWT — must match the secret used by the User service
jwt.secret=${JWT_SECRET}

# Google Safe Browsing (optional, feature-flagged)
google.safebrowsing.enabled=true
google.safebrowsing.api-key=${SAFE_BROWSING_API_KEY}
```

### Getting a Safe Browsing API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Enable APIs**.
2. Search for **Safe Browsing API** and enable it.
3. Create an **API Key** credential.
4. Set `google.safebrowsing.enabled=true` and paste the key.

> **Never commit your API key.** Use environment variables or a secrets manager in production. The placeholder `{SAFE_BROWSING_API_KEY}` in `application.properties` is intentional — it will not be picked up by Spring without the `${}` syntax.

---

## Running Locally

**Prerequisites:** Docker (for Postgres + Redis), Java 25+.

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Run the service
./gradlew bootRun
```

The service starts on **http://localhost:8081**.

---

## Security Notes

- **SSRF Protection:** `UrlExpandService` resolves the target hostname via DNS before following any redirect. Requests resolving to loopback, link-local, or private (RFC1918) addresses are blocked immediately.
- **Redirect loop detection:** A `visited` set tracks all URLs in the chain. Loops terminate early with `safe: false`.
- **Max hops:** The expander follows a maximum of **5 redirects** to prevent abuse.
- **Fail-open Safe Browsing:** If the Safe Browsing API is unreachable or returns an error, the result defaults to `safe: true` to avoid blocking legitimate URLs due to upstream outages.
