# 5. Brain

The Brain screen is your full library. Every entity you've captured is here, sortable by recency and filterable by type or substring.

## Sections, top to bottom

### Header
- A small `YOUR BRAIN` label.
- A heading that reflects the active filter — `Everything you've captured` for `All`, `<Type>s in your brain` for a specific type.

### Search bar
A text input — type any substring and the list narrows in real time. Title hits rank highest, then body, then tags. The search runs **client-side** over the in-memory cache, so it's instant.

### Filter chips
A horizontal row of chips with counts:
- `all` (always)
- `Person`, `Project`, `Commitment`, `Note`, `Idea` — each with a glyph and a count of entities of that type.

Selecting a chip narrows the list. Selecting `Person` *also* unlocks the **RecallQ band** above the list.

### RecallQ band (Person filter only)
A statistics row plus an actionable list — your relationship dashboard.

| Stat | Meaning |
|---|---|
| `orbit` | The total number of People in your brain |
| `overdue` | Number tagged `overdue` |
| `close-circle` | Number with the `close-circle` tag |

Below the stats, a **Worth a message** list shows every overdue person with their name, last-seen meta, and a chevron. Tapping a row opens that person's Detail.

### List
The list of matching entities for the active chip and search query, sorted by most recently updated. Each row shows the type glyph, title, and subtitle. Tapping a row opens its Detail screen.

The empty state — `No matches. Try capturing it.` — appears when nothing matches.

## How the data flows

The list is rendered from the same `entities()` signal Today uses. Filtering and substring matching run **client-side** to keep the UI snappy on a personal-scale dataset. The `GET /api/entities` endpoint *can* take server-side `type`, `q`, pagination, and date-range params, but the UI doesn't surface them yet — it waits until your dataset outgrows in-memory.

→ Next: [Search](search.md)
