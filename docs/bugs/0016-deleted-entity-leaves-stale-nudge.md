# Bug 0016 — Deleting an entity leaves a stale nudge in the agenda

## Symptom

Both `InMemoryBrainQDataService.removeEntity` and `HttpBrainQDataService.removeEntity` filter the deleted id out of `agenda.recent` but **not** out of `agenda.nudges`. If the deleted entity is the target of a soft nudge, the nudge stays visible until the next `/api/today` hydration. Tapping it opens a Detail screen for an entity that no longer exists; `@if (entity()) { … }` falsy → nothing renders.

```ts
removeEntity(id: string): void {
  this._entities.update(...);
  this._agenda.update((a) => ({
    ...a,
    recent: a.recent.filter((rid) => rid !== id),    // ← only recent, not nudges
  }));
  // …
}
```

## Reproduction

1. Boot the SPA. The seed `SEED_AGENDA.nudges` includes one for `p_nadia` and one for `c_run`.
2. Open the Today screen — both nudges visible under "On your mind".
3. Open `p_nadia`'s Detail and Delete it.
4. Today still shows the Nadia nudge. Tapping it opens an empty Detail overlay.

## Failing test

A unit test on `InMemoryBrainQDataService` asserts:

1. The seed agenda has a nudge for `p_nadia`.
2. After `data.removeEntity('p_nadia')`, no nudge with `entityId === 'p_nadia'` remains.

Today the second assertion fails.

## Fix

Extend the agenda update inside `removeEntity` to filter nudges as well:

```ts
this._agenda.update((a) => ({
  ...a,
  recent: a.recent.filter((rid) => rid !== id),
  nudges: a.nudges.filter((n) => n.entityId !== id),
}));
```

One extra line in each impl. Same fix for InMemory and Http.

## Verification

- New unit test passes.
- Manual: delete `p_nadia`; the Nadia nudge disappears immediately.

Status: Fixed in the next two commits.
