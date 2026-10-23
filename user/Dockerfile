# syntax=docker/dockerfile:1
# User service image for Cloud Run. Build context = this directory:
#   docker build -t virallink-user ./user
# Configuration comes only from environment variables at run time (see docs/DEPLOY.md); nothing secret is baked in.

# ---- build ------------------------------------------------------------------------------------------------------
FROM eclipse-temurin:25-jdk-noble AS build
WORKDIR /workspace

COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
COPY src src

# Tests are skipped here: CI runs them (.github/workflows/ci.yml). The cache mount only speeds up local rebuilds.
RUN --mount=type=cache,target=/root/.gradle \
    chmod +x gradlew \
 && ./gradlew --no-daemon bootJar -x test \
 && java -Djarmode=tools -jar build/libs/*.jar extract --layers --destination extracted --application-filename app.jar

# ---- run --------------------------------------------------------------------------------------------------------
FROM eclipse-temurin:25-jre-noble
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /app --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app

# One layer per Spring Boot layer, least to most frequently changing.
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

USER 10001:10001
# Cloud Run overrides PORT; this is only the local `docker run` default.
ENV PORT=8080
EXPOSE 8080

# Heap sized from the container memory limit (the JVM default of 25% wastes most of a small Cloud Run instance).
# Extra JVM flags: set JDK_JAVA_OPTIONS at run time.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
