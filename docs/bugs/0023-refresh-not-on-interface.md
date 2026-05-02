# Bug 0023 — `refresh()` exists on `HttpBrainQDataService` but isn't on the `BrainQDataService` interface

## Symptom

`HttpBrainQDataService` declares:

```ts
refresh(): void {
  this.hydrate();
  this.hydrateAgenda();
}
```

but the `BrainQDataService` interface in `domain/lib/brain-q-data.service.ts` does **not** include `refresh()`. Consumers wired through `BRAIN_Q_DATA` only see the contract — they can't call `data.refresh()` polymorphically. Today the only call site is the http impl's own `capture()` success handler (which uses `this.refresh()` directly, bypassing the interface).

A future feature ("Refresh" pull-to-refresh, "Reload from server" menu) would have to either inject the concrete class (breaking the abstraction) or branch on `instanceof`, both code smells. The slice 02 design even hints at it: "Add `refresh()` that re-fetches".

## Failing test

A new spec in the domain library mounts both implementations through the interface token, calls `data.refresh()`, and asserts the call is callable without throwing. Today the test fails to even compile in TypeScript-strict mode because `BrainQDataService` doesn't have `refresh`.

## Fix

1. Add `refresh(): void` to the `BrainQDataService` interface.
2. Add a no-op `refresh(): void {}` to `InMemoryBrainQDataService` (the in-memory cache has no remote source to re-pull).

Two lines total.

## Verification

- New unit test passes through the interface.
- Existing 82-test suite still green.

Status: Fixed in the next two commits.
