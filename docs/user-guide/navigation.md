# 2. Navigation

BrainQ has three top-level screens and one overlay.

## Top-level screens

| Screen | Route | What it shows |
|---|---|---|
| **Today** | `/today` | Your daily agenda — greeting, capture prompt, Commitments grid, On-your-mind nudges, Recently touched |
| **Brain** | `/brain` | Every entity you've captured, filterable by type and substring |
| **Search** | `/search` | A query bar that toggles between structured (substring) and semantic (meaning-based) search |

You move between them via the **tab bar** (xs / md) or the **side rail** (xl). The active tab is highlighted; the others are dimmed.

## The Capture entry

The Capture button is always at hand:
- **xs / md** — the centre disc on the tab bar
- **xl** — a `Capture` row on the side rail with a `N` keyboard hint

Tapping it opens the [Capture sheet](capture.md), an overlay that doesn't navigate away from the current screen. Closing the sheet (Cancel, the close icon, or Save) returns you exactly where you were.

## The Detail overlay

Tapping any entity row, edge chip, neighborhood node, or nudge opens that entity's [Detail](detail.md) screen as an overlay over the current stage. The Detail screen has its own header with a **Back** button (arrow on the left) that closes the overlay and returns to the screen underneath.

At xl, Detail also fills the right-side context pane with the **Neighborhood** graph — a small radial map of everything connected to the open entity.

## Keyboard hints

| Key | Action |
|---|---|
| `N` | Open Capture sheet (xl only — see the side rail label) |
| `Esc` | Close the Capture sheet or the More menu |
| `Tab` | Move focus through actionable elements; visible focus rings make this safe |

## Connection lost

If the API can't be reached, a red **`Connection lost — retrying.`** banner appears at the top of the window. Your in-memory data still works; new captures and edits will surface as toasts when they fail until the banner clears. See [Troubleshooting](troubleshooting.md).

→ Next: [Capture](capture.md)
