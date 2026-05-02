# 6. Search

Search is for when you know what you're looking for *describe-it-vaguely* level — when Brain's substring filter is too literal. Two modes share one query bar.

## Layout

### Header
A small `SEARCH` label and a heading: `Find anything you've thought about.`

### Query bar
A large text input. The placeholder switches with the mode: `name, word, or tag` for structured, `Describe what you're looking for…` for semantic.

### Mode chips
Two segmented chips, one of which is always active:

- **structured** (default) — substring match against title (×3), body (×2), and tags (×1). Runs locally, instantly. Best when you remember a fragment of the wording.
- **semantic** — sends your query to the server, which embeds it and ranks entities by cosine similarity over their pre-computed vectors. Best when you remember the *idea* but not the words.

A small mono caption next to the chips reminds you which engine is active: `indexed columns` for structured, `pgvector · cosine` for semantic.

### Suggestions (empty query)
While the query bar is empty, a small list under `Try` offers four canned starting points:
- `people I haven't seen since February`
- `ideas about writing`
- `what Iris said about seams`
- `commitments I missed this week`

Tapping a suggestion fills the bar **and switches to semantic mode**, since canned suggestions are conversational rather than literal.

### Results
A labelled section with a count:
- `Direct matches` for structured
- `Closest in meaning` for semantic

Each row is a regular entity row; tap to open Detail. The empty state reads `Nothing yet. Try different words.`.

## How semantic search works under the hood

When you start typing in semantic mode, the frontend dedupes by query string and sends `GET /api/search?q=<text>`. The server passes the query to its embedding client (Ollama in production, a no-op fallback in development), then runs

```
ORDER BY embedding <=> :v LIMIT :n
```

over the entities that have an embedding. Entities without one — typically because the embedding service was unavailable when they were captured — are simply not returned. They still show up in structured search.

If the embedding service is offline, semantic search returns an empty list (it never errors visibly). Use structured search until it comes back.

→ Next: [Detail & Edges](detail.md)
