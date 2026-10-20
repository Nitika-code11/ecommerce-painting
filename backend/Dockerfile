# syntax=docker/dockerfile:1
#
# Backend image (Spring Boot API). Two stages:
#   1. "build"   - a full JDK compiles the code and packages one runnable jar.
#   2. the final - a small JRE-only image that contains just that jar.
# Only the final stage is shipped, so compilers, Maven and the source code never reach the running container.
#
# Build:  docker build -t painting-backend ./backend
# Run:    see ../docker-compose.yml (the image refuses to start without APP_JWT_SECRET, see below)

# ---------- Stage 1: build the jar ----------
FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# Copy only the files needed to resolve dependencies first. Docker caches each step, so as long as pom.xml
# is unchanged the (slow) dependency download below is skipped on later builds.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# A script checked out on Windows may have CRLF line endings, which Linux cannot run; normalise and make it executable.
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
# The cache mount keeps ~/.m2 between builds (needs BuildKit, which is the default in current Docker).
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

# Now the source. Tests are skipped here because CI runs them (./mvnw verify); this keeps image builds fast.
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
    && mv target/*.jar /workspace/app.jar

# ---------- Stage 2: the image that actually runs ----------
FROM eclipse-temurin:17-jre-alpine

# Run as an unprivileged user: if the app were ever compromised, it would not be root inside the container.
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/app.jar /app/app.jar
USER app

# Safe by default: any profile other than "dev" is a non-dev run, which means NO sample data, NO H2 console, NO
# API docs, and the app will not start unless APP_JWT_SECRET (32+ bytes) is provided. docker-compose.yml opts in
# to "dev" for local use.
ENV SPRING_PROFILES_ACTIVE=prod
# Size the JVM heap from the container's memory limit instead of the host's, and exit on OutOfMemoryError so the
# orchestrator restarts the container instead of leaving a half-dead process running.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

# Marks the container "healthy" once /actuator/health answers 200 (wget exits non-zero on a 5xx).
# start-period gives Spring time to boot before failures are counted.
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
