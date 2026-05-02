# Bug 0007 — Today screen footer ships hardcoded counts and a fake "synced" timestamp

## Symptom

`frontend/projects/brain-q/src/app/screens/today/today.html` ends with:

```html
<footer class="footnote">
  <span class="bq-meta bq-meta-dim">BrainQ · 18 entities · 23 edges · synced 2 min ago</span>
</footer>
```

Every user, regardless of how many entities they've captured or what time it is, sees `18 entities · 23 edges · synced 2 min ago`. The user guide quotes this footer in `today.md` as if it were live data. It's not.

The App component already exposes `entityCount` and `edgeCount` as `computed` signals derived from the live `data.entities()` cache (used by the side-rail footer at xl). Today's footer just doesn't read them.

## Reproduction

1. Open the SPA on a fresh DB.
2. Today's footer reads `BrainQ · 18 entities · 23 edges · synced 2 min ago` — but you haven't captured anything.
3. Capture a Note. Footer still reads `18 entities · 23 edges`.

## Failing test

A unit test on `TodayScreen` seeds zero entities, hydrates the agenda, then asserts the footer text matches `BrainQ · 0 entities · 0 edges`. Today's hardcoded copy fails that assertion.

## Fix

Two pieces:

1. Add `entityCount` + `edgeCount` computed signals on `TodayScreen` (mirroring App's identically-named signals — both derive from `data.entities()`).
2. Replace the hardcoded footer text with interpolation: `BrainQ · {{ entityCount() }} entities · {{ edgeCount() }} edges`. Drop the misleading `synced N min ago` clause; if a sync indicator is wanted later, the [Connection lost banner](../user-guide/troubleshooting.md) already covers the negative case.

The user-guide `today.md` already promises live data — the doc is right, the implementation was wrong.

## Verification

- Unit test passes after the fix.
- Manual: capture a fresh Note, footer count goes from 0 → 1.

Status: Fixed in the next two commits.
