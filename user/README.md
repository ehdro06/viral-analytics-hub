# User Service - ViralLink

This service handles Identity & Governance for the ViralLink ecosystem.

## Stack
- Java 21+ (Virtual Threads enabled)
- Spring Boot 3
- PostgreSQL (User data, API Keys)
- Redis (Session Store)
- Spring Security OAuth2 Client (Google/GitHub)

## Configuration

You must set the following environment variables or update `src/main/resources/application.properties` before running:

```bash
# OAuth2 Credentials
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=your-google-client-id
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=your-google-client-secret
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GITHUB_CLIENT_ID=your-github-client-id
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (If not using defaults)
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/virallink_user
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=postgres

# Redis
export SPRING_DATA_REDIS_HOST=localhost
export SPRING_DATA_REDIS_PORT=6379
```

## Running

```bash
./gradlew bootRun
```

## API Endpoints

- `GET /api/v1/users/me`: Get current user profile.
- `POST /api/v1/users/keys`: Generate a new API key (returns raw key once).

## Testing

Access `http://localhost:8080` (or configured port). You will be redirected to login.
After login, you can hit the API endpoints.
