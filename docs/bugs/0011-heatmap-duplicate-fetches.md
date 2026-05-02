# Bug 0011 — `heatmapFor(id)` over-fetches `/api/commitments/{id}/activity`

## Symptom

`HttpBrainQDataService.heatmapFor(id)` runs every time a downstream `computed` re-evaluates. The current implementation:

```ts
heatmapFor(id: string): BqHeatmap {
  const cached = this._heatmaps()[id];
  if (cached) return cached;
  this.http.get<{ cells: number[][] }>(`${this.base}/commitments/${id}/activity`, ...).subscribe({...});
  return SEED_HEATMAP;
}
```

There's no in-flight guard. So every call before the first response lands fires another `GET /api/commitments/{id}/activity`. Two consequences:

1. **DetailScreen.heatmap** is a `computed` that calls `heatmapFor(id())`. Reading the signal once already fires one request. When `_heatmaps` updates (because **another** commitment's fetch came back), this computed re-runs, sees a still-missing cache for its `id`, and fires **another** request for the same id.
2. Even within a single render pass, any second consumer of `heatmap()` (server-rendered hydration, transient computed, etc.) double-fires.

The user-visible cost is small (a few duplicate GETs at most), but each one walks an EF query over `CommitmentActivity`. The radically simple fix is one in-flight set.

## Reproduction

A new unit test on `HttpBrainQDataService.heatmapFor` calls the method twice in a row and asserts `HttpTestingController.match(...)` returns exactly **one** outstanding request. Today the assertion fails — two requests are queued.

## Fix

Add a private `_inFlight = new Set<string>()`. In `heatmapFor`:

```ts
if (cached) return cached;
if (this._inFlight.has(id)) return SEED_HEATMAP;
this._inFlight.add(id);
this.http.get(...).subscribe({
  next: (resp) => {
    this._heatmaps.update((cache) => ({ ...cache, [id]: map }));
    this._inFlight.delete(id);
  },
  error: () => this._inFlight.delete(id),
});
return SEED_HEATMAP;
```

Five new lines, no signal added (the cache-and-effect pattern doesn't need one — `Set` mutation isn't observed by Angular and the second call returns SEED_HEATMAP without any signal write).

## Verification

- New unit test passes: two calls → exactly one outstanding request, the response is cached, a third call returns the cached value with no new requests.

Status: Fixed in the next two commits.
