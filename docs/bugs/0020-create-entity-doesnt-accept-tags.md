# Bug 0020 — `POST /api/entities` doesn't accept `tags`; e2e seedEntity silently drops them

## Symptom

`EntitiesController.CreateRequest` is `(string? Type, string? Text)`. Tags can't be set on creation, and there's no edit endpoint, so a seeded entity is **always** `tags: []`.

`frontend/e2e/fixtures.ts` declares `SeedEntityInput.tags?: string[]` and the slice 02 + 05 specs already pass it:

```ts
await seedEntity({ type: 'Person', title: 'Nadia Cole', tags: ['overdue'] });
```

…but the fixture quietly ignores `input.tags` when building the POST body. So the slice 02 RecallQ overdue test (and the slice 05 overdue-person nudge test) can never set up the state they need; once the e2e runner actually fires, they fail because the seeded Person isn't `overdue`.

## Reproduction

A new xUnit test posts `{ type: 'Note', text: 'plain', tags: ['x', 'y'] }` and asserts the returned DTO's `tags` is `['x','y']`. Today the assertion fails because `UnmappedMemberHandling = Disallow` rejects the unknown member with a 400 — i.e., the API can't even *receive* tags, let alone persist them.

## Fix

Two pieces:

1. **Backend** — extend `CreateRequest` with an optional `Tags` array, validate it (≤ 20 entries, each non-whitespace and ≤ 64 chars), persist it to `entity.Tags`. Default empty when omitted.
2. **Frontend fixture** — pass `input.tags` through to the request body so slice 02/05 specs actually seed tagged entities.

Validation cutoffs match the existing length envelope (`title ≤ 200`, `body ≤ 100000`) — small, hard caps that protect the database.

## Verification

- New xUnit assertions:
  - POST with `tags: ['overdue']` → 201 with `tags: ['overdue']`.
  - POST with a 65-char tag → 400 (`tag >64`).
  - POST with 21 tags → 400 (`>20 tags`).
  - POST without tags → 201 with `tags: []` (existing behaviour preserved).
- Frontend fixture passes tags through; slice 02 and slice 05 specs can stand up the state they describe.

Status: Fixed in the next two commits.
