# Bug 0025 — `inferType` and `suggestRelated` duplicated across both data-service impls

## Symptom

`InMemoryBrainQDataService.inferType` and `HttpBrainQDataService.inferType` are byte-identical:

```ts
inferType(text: string): BqEntityType {
  const t = text.toLowerCase().trim();
  if (!t) return 'Note';
  if (/\b(idea|what if|maybe i could|possibility)\b/.test(t)) return 'Idea';
  if (/\b(every day|daily|each week|commit|goal of)\b/.test(t)) return 'Commitment';
  if (
    /\b(met|coffee with|called|emailed|birthday)\b/.test(t) ||
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text)
  )
    return 'Person';
  if (/\bproject\b|\bship\b|\bdeadline\b|\bmilestone\b/.test(t)) return 'Project';
  return 'Note';
}
```

Same shape applies to `suggestRelated`. The slice 01 design explicitly says inference and suggestion are deterministic, free, and should "stay client-side" — they're pure functions of `(text, entities)`. They have no business living inside two implementations of a service that's supposed to vary by *storage*, not by inference logic.

If a future tweak (new keyword, new heuristic, fuzzy match) lands in only one impl, behaviour silently diverges. Slice 04 already extracted `structuredSearch` into a free util for the same reason.

## Failing test

A new spec on the freshly extracted `inferType(text)` and `suggestRelated(entities, text, limit)` utils mirroring the existing `structuredSearch` pattern. Today the test fails to import because no such module exists.

## Fix

Extract two pure functions to `frontend/projects/domain/src/lib/infer-type.ts`:

```ts
export function inferType(text: string): BqEntityType { /* same body */ }
export function suggestRelated(entities: readonly BqEntity[], text: string, limit = 3): readonly BqEntity[] { /* same body */ }
```

Re-export them from the public-api. Both impls' methods become one-line delegations to the util. The public interface (`BrainQDataService.inferType` / `suggestRelated`) is unchanged.

## Verification

- New unit spec on the util passes.
- 84-test suite stays green; both impls still satisfy the interface.

Status: Fixed in the next two commits.
