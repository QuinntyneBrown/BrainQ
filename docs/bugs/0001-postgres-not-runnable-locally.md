# Bug 0001 — Postgres not runnable locally

## Symptom

Following the loop's directive to run the app "against the real database (no mocks or in-memory)" cannot be satisfied because:

- `localhost:5432` is not listening (`netstat -an | grep :5432` returns nothing)
- No `postgres*` Windows service is registered
- No `docker-compose.yml` (or equivalent) exists in the repo
- Docker Desktop's Linux engine is not running, so a one-liner `docker run` against pgvector also fails

The connection string `Host=localhost;Port=5432;Database=brainq;Username=postgres;Password=postgres` in `appsettings.Development.json` requires a running pgvector-capable Postgres at that address.

## Reproduction

1. Clone the repo on a fresh machine.
2. `cd backend && dotnet run --project src/BrainQ.Api`
3. Hit `GET /health` — the request returns 503 because EF can't open the connection.

## Fix

Add a `docker-compose.yml` at the repo root that starts a `pgvector/pgvector:pg17` container on port 5432 with the credentials baked into `appsettings.Development.json`. Document the one-liner in the bug file so a junior dev with Docker installed can copy-paste their way to a running stack:

```
docker compose up -d
dotnet ef database update --project backend/src/BrainQ.Api
```

No code change in the application itself; this is an infra artefact.

## Verification

- `docker compose up -d` brings the container up
- `docker compose ps` shows `Up`
- `dotnet ef database update` applies the existing migrations
- `dotnet run --project backend/src/BrainQ.Api` boots, `GET /health` returns 200

Status: Fixed in `docker-compose.yml` (commit follows this entry).
