# Bug 0035 — Semantic search e2e test silently requires Ollama running

## Symptom

`04-semantic-search.spec.ts › semantic mode hits /api/search and ranks by
closeness` fails locally because `appsettings.Development.json` sets

```
"Embeddings": { "Provider": "Null", ... }
```

`NullEmbeddingClient` returns a no-op embedding, so `POST /api/entities`
saves the seeded test entity without a vector. `GET /api/search?q=…` then
returns an empty list (entities without an embedding are skipped per
docs/user-guide/search.md), and `expect(results.first()).toContainText(...)`
times out.

## Failing test

`04-semantic-search.spec.ts:4` — fails on every developer machine that
hasn't started Ollama and pulled `nomic-embed-text`.

## Fix

Two reasonable options:

1. **Skip the test when no embedding service is configured.** Read the
   active provider via a small `/api/diagnostics` endpoint or a fixture
   probe of `/api/search?q=ping`, and `test.skip()` cleanly when results
   are unavailable. This keeps semantic search a coverage gate when
   Ollama is up but doesn't fail the rest of the suite when it isn't.

2. **Provide an in-memory deterministic embedding for `Provider=Null`** —
   e.g. hash the text into a fixed-dimension vector. Cheap, makes the
   test green without external dependencies, and matches the "no-op
   fallback in development" intent in `docs/user-guide/search.md`.

Either change is safe; option 2 is closer to "tests against the real DB
without external services" and is recommended.

## Verification

- `npx playwright test --project=xl e2e/specs/04-semantic-search.spec.ts`
  passes locally without Ollama.
- The user-guide claim "If the embedding service is offline, semantic
  search returns an empty list" still holds in production where
  `Provider=Ollama`.

Status: Open. Out of scope for this session.
