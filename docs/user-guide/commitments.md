# 8. Commitments & Activity

Commitments are the only entity type with first-class activity tracking. Capture one with text like `read 30 minutes daily`, and BrainQ infers `Commitment` from the cadence keyword. From there, three surfaces matter.

## Logging today

You log a commitment as **done for today** in either of two places:

1. **Today → Commitments cell** — tap the **ring** on the left of the cell. The ring fills, a check mark appears in the centre, and the meta line updates immediately to reflect the new streak.
2. **Detail → Log today button** — at the bottom of the Commitment stats card. Once today is logged, the button label flips to `Logged today` and disables itself.

Both routes call the same endpoint. Logging is **idempotent within a day** — the second tap is a no-op; your streak doesn't double.

## How the streak is computed

The streak is the count of consecutive days, walking *backward from today*, where you have at least one logged activity. So:

- Logged today and yesterday and the day before → streak = 3.
- Logged today, skipped yesterday, logged the day before → streak = 1 (the chain breaks at yesterday).
- Logged yesterday but not today → streak = 0 today, will be 2 if you log today.

The server is the authoritative streak source. The frontend optimistically increments by 1 when you tap, then overwrites with whatever the server returns when the request lands.

## The heatmap

On a Commitment's Detail screen, under the stats card, sits an **18-week × 7-day heatmap**:

- Columns are weeks, oldest on the left, current on the right.
- Rows are days within a week, Monday through Sunday.
- Each cell carries a `data-band` 0–4 reflecting how much activity that day held:
  - `0` — no activity
  - `1` — exactly 1 log
  - `2` — 2 logs
  - `3` — 3–4 logs
  - `4` — 5+ logs

Today is the **rightmost cell of the bottom row**. After a fresh log it lights up (band ≥ 1) the next time you reload Detail. The heatmap is fetched lazily — the first time you open a Commitment's Detail, the frontend pulls 18 weeks of activity and caches it. After you log, the cache for that commitment invalidates so the next view shows the up-to-date band.

## Cadence and what counts

Today's slice handles **daily** cadence correctly. A commitment captured with cadence `weekly` (e.g. `Call someone you love weekly`) currently uses the daily streak rule, which understates a weekly practice. A separate slice will land weekly-aware streaks once you have your first weekly commitment in active use.

There's no UI for **backfilling a missed day** or **undoing a log**. Both are deferred — the simplest mental model is "today, did it or didn't I", and that's all you can express today.

→ Next: [Personalization (Tweaks)](personalization.md)
