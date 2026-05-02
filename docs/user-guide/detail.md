# 7. Detail & Edges

Tapping any entity — from Today, Brain, Search, a nudge, an edge chip, or the Neighborhood graph — opens its Detail screen as an overlay.

## The header

- **Back** (arrow icon, left) — closes the overlay.
- **Type meta** (centre) — the entity's type glyph + label.
- **More** (`…` icon, right) — opens a small menu with `Delete`.

## The body

### Title and subtitle
A large display title (the captured first line, up to 80 chars) and a dim subtitle line (`Just captured` for fresh captures; later this becomes a relative timestamp or a contextual line).

### Body text
The full free-form text you captured, rendered as plain text. HTML is escaped — pasting `<script>` does nothing dangerous; it shows the literal characters.

### Type-specific stats card
The card in the middle changes shape based on type:

| Type | Card contents |
|---|---|
| **Person** | `last seen`, `touchpoints`, `relationship` |
| **Project** | `status`, `due`, `progress` (with a progress bar underneath) |
| **Commitment** | `streak`, `today`, `target` (with the heatmap and a `Log today` button — see [Commitments](commitments.md)) |
| **Note / Idea** | No stats card — the body text alone |

### Connections (outbound edges)
A `Connections` section appears when the entity has outbound edges. Each edge renders as a small **edge chip** with the relation kind (`mentions`, `blocks`, `fulfills`, `relatesTo`) and the target's title. Tap a chip to navigate to the target.

### Mentioned by (inbound edges)
A `Mentioned by` section appears when other entities point at this one. Each row shows the source entity's glyph, title, and the `via <relation>` line. Tap a row to navigate to the source.

## The More menu — delete

Tap **More** → **Delete**. The entity is removed *optimistically*: it disappears from every list before the server confirms, and the overlay closes. On the server, the delete cascades — every edge that mentions this entity in either direction is removed in the same transaction. If the delete fails, the entity reappears in the cache (the rollback) and stays in the database.

There is no undo and no "are you sure" sheet today. Once a delete reaches the server, it's permanent.

## The Neighborhood pane (xl only)

At desktop width, the right context pane becomes the **Neighborhood** view of the open entity:

- A 220×220 SVG with the open entity at the centre.
- Up to N nodes around it — outbound edges + inbound edges, all on one ring at evenly spaced angles.
- Tap any node to navigate to it; the screen recenters on the new entity, and the ring redraws around the new centre.

Below the SVG, a `NEIGHBORS` list mirrors the graph as tappable rows with the relation direction (`→` outbound, `←` inbound) and the relation kind.

→ Next: [Commitments & Activity](commitments.md)
