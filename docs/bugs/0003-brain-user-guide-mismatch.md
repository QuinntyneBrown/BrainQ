# Bug 0003 — `brain.md` user guide describes labels that don't match the implementation

## Symptom

A user reading `docs/user-guide/brain.md` and switching to the Brain screen sees different headings and stat labels from what the guide promises:

| Doc claims | Actual UI |
|---|---|
| Heading for `All` filter: `Everything you've captured` | `Everything` |
| Heading for type filters: `<Type>s in your brain` | `<typeLabel>s` (e.g. `notes`, `ideas`) |
| Heading for `Person` filter: not specified | `People you know` |
| RecallQ stat 1 label: `orbit` | `people in orbit` |
| RecallQ stat 2 label: `overdue` | `overdue to reach out` |
| RecallQ stat 3 label: `close-circle` | `close circle` |
| RecallQ "close" group: tag `close-circle` | Tags `close` OR `family` |

Source: `frontend/projects/brain-q/src/app/screens/brain/brain.ts` `heading`, `recallqStats`, `close` computed signals.

## Reproduction

1. Read `docs/user-guide/brain.md` §Filter chips and §RecallQ band.
2. Open the Brain screen, tap the `Person` filter chip.
3. Visible heading and stat-band labels do not match the doc.

## Fix

Two parts:

1. **Pin the strings** with a unit test on `BrainScreen` that asserts the live values of `heading()`, `recallqStats()` labels, and the tags the `close` computed reads — so future renaming surfaces here, not in the user guide.
2. **Reconcile `brain.md`** to the implementation.

There's no production code change — the implementation is the source of truth, the docs were ahead of reality.

## Verification

- Unit test passes after the doc + spec fixture lands.
- A reader of `brain.md` opening the Brain screen sees exactly the strings the guide quotes.

Status: Fixed in the next two commits (failing-test commit + reconciliation commit).
