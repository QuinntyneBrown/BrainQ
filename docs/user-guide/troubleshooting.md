# 10. Troubleshooting

Most things in BrainQ surface their own status. This page collects what those signals mean and what to do.

## "Connection lost — retrying." banner at the top

BrainQ pings `GET /health` immediately on load and every 60 seconds after that. If the request fails (network down, server stopped, 503 from the API), the red banner appears at the top of every screen.

While the banner is up:
- **Reads keep working.** Whatever was already loaded into the in-memory cache stays usable — Today, Brain, Search-structured, Detail of any entity already in the cache.
- **Writes will fail.** Captures, deletes, edge mutations, and commitment logs that hit the server during an outage roll back optimistically — you'll see a `Save failed — try again` toast.
- **Semantic search returns empty.** The mode still works locally on suggestions; results from the API just don't come.

The banner clears automatically the next time `GET /health` returns 200. No action required on your part.

## "Save failed — try again" toast

Shown when an optimistic capture, edge mutation, or delete couldn't be confirmed by the server. The optimistic record has already been rolled back, so the screen reflects truth — your text is gone from the cache. Re-open Capture and try again. If it keeps happening, check the connection-lost banner and your network.

## A captured entity isn't showing up

A few things to check, in order:

1. Did the toast say `Saved as <type>`? If you saw `Save failed`, the entity never made it.
2. Are you on the right filter on Brain? An `Idea` you captured won't show under the `Person` chip.
3. Refresh the page. Hydration re-fetches `GET /api/entities` — if the entity is on the server, it'll be back in the cache.

## Semantic search returns nothing

Semantic search needs two things:
1. A reachable embedding service (Ollama in production).
2. Entities that already have stored embeddings.

When the embedding service is offline at *capture* time, the entity is saved without an embedding — it'll never appear in semantic results. It's still findable via structured search, Brain, or Detail navigation. If a lot of recent entities are missing from semantic search, that's why.

## A delete didn't take

The Detail overlay closing is **optimistic** — it can close before the server confirms. If the request fails, the entity reappears in the cache; tap into Brain and you'll see it again. Try the delete a second time once the connection-lost banner clears.

## My theme / accent / density reset

Personalization lives in `localStorage` per browser:
- Clearing your browser's site data resets all three.
- Switching browsers or devices uses each browser's own settings.
- An incognito / private window starts at the defaults every time.

This is by design — see [Personalization](personalization.md).

## Common questions

### Where is my data stored?
Locally on your machine in development; in a single PostgreSQL database in production. There is no shared workspace and no second user. See the architecture spec for the full picture.

### Can I export?
Not via the UI yet. Every read endpoint (`/api/entities`, `/api/edges`, `/api/commitments/{id}/activity`) returns plain JSON, so a small script can dump everything until an export button ships.

### Can I edit an entity after saving?
Not yet. Today the only mutations from the UI are *capture*, *delete*, and *log commitment*. Editing the title or body is a planned slice; for now, capture a new note that supersedes the old and delete the original.

### Is anything synced across devices?
The graph itself is — every device hitting the same API sees the same entities. Personalization (theme, accent, density) is **not** synced; it's per-browser via `localStorage`.
