# Bug 0019 — Detail's `Connections` section renders empty when every edge target is deleted

## Symptom

`detail.html` guards the outbound-edges section on the **unfiltered** edge count:

```html
@if (e.edges.length) {
  <section class="detail-block" data-testid="detail-connections">
    <bq-section-label>Connections</bq-section-label>
    <div class="edge-list">
      @for (edge of e.edges; track edge.to) {
        @if (edgeTarget(edge.to); as t) {
          <bq-edge-chip … />
        }
      }
    </div>
  </section>
}
```

If every entity referenced by `e.edges` has been deleted (the cascade in `EntitiesController.DeleteAsync` only removes the edges the deleted entity is on; edges *from* a different surviving entity *to* the deleted one are also cleaned up there, but the surviving entity's optimistic in-memory cache may still contain those `to` ids until the next hydration), the inner `@for + @if` collapses to nothing — the user sees the **`Connections`** label sitting over an empty box.

The `Mentioned by` section right below already does the right thing — it derives a `inbound()` computed that maps and filters by `src`, then `@if (inbound().length)` decides whether to render the whole section.

## Reproduction

A unit test on `DetailScreen`:

1. Capture entity A and B (in-memory).
2. `addEdge(A, B, 'mentions')`.
3. `removeEntity(B)` — A's `edges` array still has `{ to: B.id, kind: 'mentions' }` in the optimistic cache because slice 03's `removeEntity` only filters edges off **other** entities; A's outbound edges to B aren't pruned.
4. Open Detail of A. Today the assertion `host.querySelector('[data-testid="detail-connections"]')` is truthy — section renders empty. After the fix, the section is hidden (the assertion is null).

## Fix

Mirror the `inbound()` pattern: add a `connections()` computed on `DetailScreen` that maps `e.edges` to `{ edge, target }` and filters by `target`. Use `connections().length` in the `@if`, and iterate `connections()` in the `@for`.

```ts
readonly connections = computed(() => {
  const e = this.entity();
  if (!e) return [];
  return e.edges
    .map((edge) => ({ edge, target: this.data.byId(edge.to) }))
    .filter((x): x is { edge: typeof x.edge; target: BqEntity } => !!x.target);
});
```

Two-line template tweak, one-block component addition.

A separate concern: `removeEntity` should also prune dangling edges from surviving entities' `edges` arrays in the in-memory cache. Today it only filters edges where `to === id` against entities **other than** the deleted one. Wait — re-reading:

```ts
this._entities.update((xs) =>
  xs.filter((e) => e.id !== id)
    .map((e) => ({ ...e, edges: e.edges.filter((edge) => edge.to !== id) })),
);
```

OK it does prune. So this scenario only manifests if the cache hasn't applied that update yet, or in race windows. Either way, the `connections()` filter is a defence-in-depth against the empty-section render.

## Verification

- Unit test passes after the template + component fix.
- Manual: delete a target of an outbound edge — the Connections section disappears if it had no other resolvable targets.

Status: Fixed in the next two commits.
