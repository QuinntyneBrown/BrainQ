# Bug 0009 — `getting-started.md` misnames the type glyphs

## Symptom

`docs/user-guide/getting-started.md` lists the five entity types and what their glyph looks like:

| Type | Glyph (doc) | Glyph (actual SVG in `bq-type-glyph`) |
|---|---|---|
| Note | dot | notepad (page with folded corner) |
| Idea | spark | lightbulb |
| Person | initial | silhouette (head + shoulders) |
| Project | square | clipboard (rectangle with two horizontal lines) |
| Commitment | ring | clock circle (circle with one minute hand) |

Source: `frontend/projects/components/src/lib/type-glyph/type-glyph.html` `@switch` block — five `<svg>` shapes, none of which match the four "dot/spark/initial/square" labels (Project's "square" is the closest of the bunch). The "initial" label is especially misleading: that's `BqNameInit` (a coloured circle with letter initials, used on Person *detail* cards), not the type glyph that appears in lists and headers.

## Reproduction

1. Read `docs/user-guide/getting-started.md` §The five entity types.
2. Open the SPA, look at any Brain row or the Detail header — the visible glyphs don't match the table.

## Failing test

A new unit spec on `BqTypeGlyph` mounts the component once per `BqEntityType` and asserts each render includes at least one SVG primitive (`circle`, `rect`, or `path`). Pins the design's promise that every type carries a non-empty distinct glyph; today this passes, but it serves as the regression net for the doc reconciliation that follows.

## Fix

Rewrite the §The five entity types table in `getting-started.md` to describe the actual SVGs: notepad / lightbulb / silhouette / clipboard / clock circle. The implementation is the source of truth — no SVG change is needed.

## Verification

- New unit spec passes.
- A reader of `getting-started.md` opening the app sees the same shapes the doc names.

Status: Fixed in the next two commits.
