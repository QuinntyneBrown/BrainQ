# Bug 0021 — Missing EF Core migrations for `Edge` and `CommitmentActivity`

## Symptom

`AppDbContext` declares three `DbSet`s:

```csharp
public DbSet<Entity> Entities => Set<Entity>();
public DbSet<Edge> Edges => Set<Edge>();
public DbSet<CommitmentActivity> CommitmentActivities => Set<CommitmentActivity>();
```

…but the `Migrations/` folder only ships **one** migration: `20260502004301_InitialEntityCapture`. That migration creates the `Entity` table only — `Edge` and `CommitmentActivity` were added in slices 03 and 06 *without* generating new migrations.

Running against a real Postgres:

1. `docker compose up -d` (bug 0001 fix).
2. `dotnet ef database update --project backend/src/BrainQ.Api` — applies `InitialEntityCapture` only.
3. App boots, `GET /health` is fine.
4. **Any** call to `db.Edges` / `db.CommitmentActivities` (e.g. `GET /api/edges`, `POST /api/commitments/{id}/log`, `GET /api/commitments/{id}/activity`, the bug-0004 hydration in `EntitiesController.ListAsync`) raises `Npgsql.PostgresException: 42P01: relation "Edge" does not exist`.

In short: every slice 03+ flow is broken end-to-end on a real Postgres deploy. The xUnit suite passes because it uses `Microsoft.EntityFrameworkCore.InMemory`, which doesn't enforce migrations.

## Reproduction

1. Apply bug 0001 + 0017's docker-compose / proxy.
2. `dotnet ef database update --project backend/src/BrainQ.Api`.
3. `dotnet run --project backend/src/BrainQ.Api`.
4. `curl http://localhost:5159/api/edges` → `500` with the `relation "Edge" does not exist` SQL error in the API log.

## Failing test

This is an EF migrations-not-code issue, but a test can pin the *count* of pending model changes:

A new xUnit case in `OpsTests` calls `AppDbContext.GetService<IMigrator>().HasPendingModelChanges()` (or the equivalent `Database.HasPendingModelChangesAsync()` API in EF Core 9+) and asserts it returns `false`. Today it returns `true` because the model has `Edge` + `CommitmentActivity` mapped but no migration for them.

## Fix

Generate one new migration that captures both tables and the design's vector index:

```
dotnet ef migrations add AddEdgesAndCommitmentActivities --project backend/src/BrainQ.Api
```

The generated `*.cs` and `*.Designer.cs` + updated `AppDbContextModelSnapshot.cs` are committed alongside this fix. The HNSW index on `Entity.Embedding` (deferred from slice 04 / 08) can be added in a follow-up — this migration just brings the schema in line with the model so the existing endpoints can run.

## Verification

- Updated test passes (`HasPendingModelChanges()` is `false`).
- After running `dotnet ef database update`, `\dt` in psql shows `"Entity"`, `"Edge"`, `"CommitmentActivity"`.
- `curl http://localhost:5159/api/edges` returns `200 []`.

Status: Fixed in the next two commits.
