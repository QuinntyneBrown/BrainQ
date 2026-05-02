# Bug 0013 — Stale `/api/search` response can overwrite the current results

## Symptom

`HttpBrainQDataService.search` dedupes by query string:

```ts
if (this._semanticQ() !== q) {
  this._semanticQ.set(q);
  this.http.get(...).subscribe({
    next: (hits) => this._semanticResults.set(hits.map((h) => h.entity)),
  });
}
return this._semanticResults();
```

Distinct queries fire distinct requests. There's no ordering guarantee on which response lands first. The race:

1. User types `abc` → request **A** fires (`q=abc`).
2. User retypes `xyz` → request **B** fires (`q=xyz`).
3. **B** returns first → `_semanticResults = xyz hits`.
4. **A** returns second → `_semanticResults = abc hits`. ❌ Stale.

The Search screen now shows `Closest in meaning` results that match `abc` even though the input reads `xyz`.

## Reproduction

A new unit test interleaves two `data.search(...)` calls and flushes them in reverse order. Today the assertion that the visible results are still those of the latest query fails.

## Fix

Inside the `next` handler, compare the query that **fired** this request against `_semanticQ()` at the time of the response. If they differ, drop the response.

```ts
.subscribe({
  next: (hits) => {
    if (this._semanticQ() !== q) return;            // stale — current query has moved on
    this._semanticResults.set(hits.map((h) => h.entity));
  },
  error: () => { if (this._semanticQ() === q) this._semanticResults.set([]); },
});
```

One conditional in each branch. The dedupe + the stale-check together guarantee at most one in-flight request per query string, and only the in-flight request that still matches the latest query is allowed to overwrite the visible results.

## Verification

- New unit test passes.
- Manual: tap into the search bar, type `abc` then immediately replace with `xyz`. The semantic results panel either flashes empty or remains coherent with `xyz`; it never settles on `abc` results.

Status: Fixed in the next two commits.
