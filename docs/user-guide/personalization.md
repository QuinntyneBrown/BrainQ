# 9. Personalization (Tweaks)

A floating cog button sits in the bottom-right of every screen. Tapping it opens the **Tweaks** panel — three controls that change how BrainQ looks. Selections persist across reloads via `localStorage` and apply instantly.

## Theme

Three options as a segmented control: `light`, `sepia`, `dark`. Selection writes `data-theme` on `<html>`, which the design tokens consume to switch every colour at once.

| Theme | When it fits |
|---|---|
| **light** | Default — daytime, high ambient light |
| **sepia** | Warm, lower-contrast — long reading sessions |
| **dark** | Low ambient light — night, dim rooms |

## Accent

Five swatches: `terracotta` (default), `ink`, `moss`, `ochre`, `rose`. The selected swatch gets a small ring outline. Selection writes three CSS custom properties on `:root`:

- `--bq-accent` — the base accent colour (used for ring fills, the active "Log today" button, the Connection-lost banner)
- `--bq-accent-soft` — a translucent tint for backgrounds
- `--bq-accent-ink` — the foreground that reads cleanly on the accent (used for button text)

You'll see the accent change everywhere accents are used the moment you tap. There's no apply step.

## Density

Two options: `cozy` (default), `compact`. Selection writes `data-density` on `<html>`. The token system tightens spacing and line-heights for `compact` without changing component layout — same screens, less air.

## Persistence

Each setting writes to a `localStorage` key:

| Setting | Key | Default |
|---|---|---|
| Theme | `bq.theme` | `light` |
| Accent | `bq.accent` | `terracotta` |
| Density | `bq.density` | `cozy` |

If a key is missing or holds an unknown value, BrainQ falls back to the default. Settings are **device-local** — a setting on your laptop doesn't sync to your phone. (A `/api/preferences` endpoint can replace localStorage if multi-device sync becomes a need; not today.)

## Resetting

There's no Reset button. To return to defaults, clear the three keys via your browser's devtools (`Application → Local Storage → bq.theme/.accent/.density → delete`) and reload.

→ Next: [Troubleshooting](troubleshooting.md)
