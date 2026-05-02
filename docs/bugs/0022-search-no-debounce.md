# Bug 0022 — `SearchScreen` semantic mode fires `/api/search` per keystroke

## Symptom

`SearchScreen.results` is a plain `computed` of `data.search(query, mode)`. In semantic mode each keystroke updates `query`, the computed re-runs, `HttpBrainQDataService.search` sees a new `q` (so the per-string dedupe doesn't help), and a new `GET /api/search` fires.

Typing `graph` triggers five round-trips (one per character). The `take` query was clamped to ≤ 50, but each call still walks an embedding + a vector ORDER BY on the server. Reads aren't rate-limited (the slice 08 limiter only covers writes), so the cost compounds linearly with typing speed.

The slice 04 design hinted at this — "User toggles to `semantic`, types a query, presses Enter (or each keystroke after debounce)" — but no debounce shipped.

## Failing test

A new vitest case on `SearchScreen` interleaves `query.set('g') → 'gr' → 'graph'` with brief `Promise`-based waits, asserts **zero** `/api/search` requests outstanding inside the debounce window, then waits past 250 ms and asserts **exactly one** request with `q=graph`. Today the assertion fails because three requests queue immediately.

## Fix

Inside `SearchScreen`:

```ts
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
…
private readonly debouncedQuery = toSignal(
  toObservable(this.query).pipe(debounceTime(250)),
  { initialValue: '' },
);

readonly results = computed(() => {
  const m = this.mode();
  const q = m === 'semantic' ? this.debouncedQuery() : this.query();
  return this.data.search(q, m);
});
```

Structured mode keeps using the immediate `query()` (the local cache is instant; debouncing it would feel sluggish). Semantic mode now waits 250 ms after the last keystroke before firing — the user's still-typing pause covers the request burst.

## Verification

- New vitest case passes.
- Manual: open semantic mode, type `graph database` quickly, devtools network shows one `/api/search` per natural pause instead of one per keystroke.

Status: Fixed in the next two commits.
