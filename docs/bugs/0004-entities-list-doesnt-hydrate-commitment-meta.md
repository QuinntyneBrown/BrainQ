# Bug 0004 — `GET /api/entities` returns Commitments with empty `meta.streak` / `meta.todayDone`

## Symptom

Slice 06 design specifies:

> `EntityDto.From(e)` is updated to pull a per-entity precomputed activity bundle when `Type == Commitment` so list responses stay simple. The simplest path is one extra query in `EntitiesEndpoints.ListAsync` that fetches all activity rows for commitment ids in the page and stitches `streak`/`todayDone` into the DTOs.

The implementation hydrated streak + todayDone only in `CommitmentsController.ListAsync` (`GET /api/commitments`). The flagship list endpoint **`GET /api/entities`** still returns Commitments with `meta: {}`. The Today screen reads its commitments from `data.entities()` (which is fed by `/api/entities`), so:

- After a user logs a commitment, the optimistic local update flips the ring full and shows `1-day streak`.
- On the next page reload (or any other `refresh()` call), the http service re-hydrates from `/api/entities`, server returns the un-hydrated DTO, the ring goes back to empty and the streak label resets to `0-day streak`.

Fresh Commitments and existing logs stay in the database, but the user's UI silently lies about the streak.

## Reproduction

1. `docker compose up -d` (bug 0001 fix).
2. `dotnet run --project backend/src/BrainQ.Api` and `npm start` in `frontend`.
3. Capture a Commitment, e.g. `Read 30 minutes daily`.
4. On Today, tap the ring of the new cell. Streak label flips to `1-day streak`.
5. **Refresh the page.**
6. The streak label is back to `0-day streak`. The ring is empty.

## Failing test

`backend/tests/BrainQ.Api.Tests/EntitiesListHydratesCommitmentMetaTests.cs` — POSTs a Commitment, logs it via `POST /api/commitments/{id}/log`, then `GET /api/entities` and asserts the Commitment's `meta.streak` is 1 and `meta.todayDone` is true. Fails today because `EntitiesController.ListAsync` returns plain `EntityDto.From(e)` for Commitments.

## Fix

Inside `EntitiesController.ListAsync`, after the page has been materialised, do one extra `db.CommitmentActivities.Where(a => commitmentIds.Contains(a.CommitmentEntityId))` query, then map every Commitment-typed DTO through `WithCommitmentMeta(streak, todayDone)` using the same `StreakFromDates` helper `CommitmentsController` already exposes. One round-trip, one helper reuse, zero new abstractions.

## Verification

- The new xUnit test passes after the fix.
- After the fix, repeating the manual repro keeps the streak at `1-day streak` across reloads.

Status: Fixed in the next two commits (failing-test + implementation).
