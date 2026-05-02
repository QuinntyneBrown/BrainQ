# 4. Today

Today is the screen you land on. It's tuned to orient you in under five seconds: where you are in the day, what you owe yourself, who's on your mind, and what you most recently touched.

## Sections, top to bottom

### Header
- The current date in `DAY, MMM D` format (e.g. `FRIDAY, MAY 1`).
- A greeting bucketed by hour:
  - before 5am → **Quiet night**
  - 5–11 → **Quiet morning**
  - 12–16 → **Steady afternoon**
  - 17 onward → **Easy evening**

### Capture prompt
A wide pill that reads `What's on your mind?`. Tapping it opens the [Capture sheet](capture.md) — same as the Capture button on the tab bar / side rail.

### Commitments
A grid of every Commitment you've captured. Each cell shows:
- A **ring**, full when today is logged, empty otherwise, with a check mark inside when logged.
- The commitment **title**.
- A **streak meta line**: `<n>-day streak · <cadence>`.

Tapping the **ring** on the left logs (or already-logged-no-ops) today's activity. Tapping the **title** on the right opens the commitment's [Detail](detail.md) screen. See [Commitments & Activity](commitments.md) for the full mechanics.

### On your mind (nudges)
Soft suggestions derived from your data, not pushed at you. The slice that ships today surfaces:
- **Overdue people** — anyone with `overdue` in their tags gets a nudge `<Title> — worth a message.`

Tapping a nudge opens the linked entity's Detail screen. Nudges are stateless — they appear when their condition holds and disappear when it doesn't.

### Recently touched
The three most recently updated entities, regardless of type. Tap any row to open Detail.

### Footer
A faint storage status line — `BrainQ · <n> entities · <m> edges · synced …` — informational only.

## How the data flows

When BrainQ loads, the frontend hits `GET /api/today` and `GET /api/entities` in parallel. The greeting, prompt, recent IDs, and nudges come from `/api/today`; the entity bodies you see in Recently touched and the Commitments grid come from `/api/entities`. Both are read-only and side-effect-free.

If the API is unreachable on first load, the rest of the app still functions on its in-memory cache and a [Connection lost banner](troubleshooting.md) appears.

→ Next: [Brain](brain.md)
