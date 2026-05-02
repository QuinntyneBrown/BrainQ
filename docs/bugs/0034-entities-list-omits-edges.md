# Bug 0034 — `GET /api/entities` always returns `edges: []`

## Symptom

Capture two entities and an edge between them via the API, then list:

```
POST /api/entities  → A (Person)
POST /api/entities  → B (Note)
POST /api/edges     → { fromEntityId: A, toEntityId: B, type: 'mentions' }  // 201

GET  /api/entities
[
  { "id": "A", ..., "edges": [] },
  { "id": "B", ..., "edges": [] }
]
```

The edge persists (a second POST is rejected with the unique-constraint
error), but it never reaches the client. As a result the **Connections**
section on Detail and the **Mentioned by** section never render anything,
and the xl Neighborhood graph has only the centre node.

## Root cause

`Contracts/EntityDto.From` hard-codes `Array.Empty<EntityEdgeDto>()`:

```csharp
public static EntityDto From(Entity entity) =>
    new(
        entity.Id,
        ...
        Array.Empty<EntityEdgeDto>(),   // edges always empty
        ...);
```

`EntitiesController.ListAsync` calls `EntityDto.From(e)` without joining
the `Edges` table or projecting `e.Edges` into the DTO.

## Failing test

`03-detail-edges.spec.ts › outbound + inbound edges render` — even after
`seedGraph` is updated to POST `/api/edges`, the test fails because
`detail-connections` resolves to no `edge-chip-` children.

## Fix

In `EntitiesController.ListAsync`, project edges alongside the entity:

```csharp
var ids = items.Select(e => e.Id).ToList();
var outbound = await db.Edges
    .Where(x => ids.Contains(x.FromEntityId))
    .ToListAsync(ct);
var byFrom = outbound.ToLookup(x => x.FromEntityId);

return Ok(items.Select(e =>
{
    var edges = byFrom[e.Id]
        .Select(x => new EntityEdgeDto(x.Type.ToString(), x.ToEntityId))
        .ToList();
    var dto = EntityDto.From(e) with { Edges = edges };
    ...
}));
```

(Or wire EF Core navigation `Entity.Edges` → `HasMany` and call
`.Include(e => e.Edges)` on the query — the explicit lookup avoids the
overhead of cartesian product.)

`GetAsync(id)` should mirror the same projection.

## Verification

- After fix, `GET /api/entities` returns `edges: [{kind:'mentions', to:'B'}, ...]`.
- `03-detail-edges.spec.ts` passes (with the bug-0033 `chip('All')` fix).
- Detail of any entity with outbound edges shows the **Connections**
  section; entities pointed at show **Mentioned by**.

Status: Open. Not fixed in this session — backend feature work, tracked
separately from the test infra fixes in bug 0033.
