# @brainq/components

The BrainQ design system: a small, opinionated set of standalone Angular
components paired with CSS custom-property design tokens. Source-of-truth design
lives in `docs/design-files/`.

## Setup

Import the design tokens once at the application root (e.g. `styles.scss`):

```scss
@use "components/styles/tokens";
@use "components/styles/base"; // optional typography utilities
```

Then use any component as a standalone import:

```ts
import { BqChip, BqEntityRow, BqIcon } from 'components';
```

## Theming

The tokens layer reads `data-theme` and `data-density` attributes on
`<html>`/`<body>`:

```html
<html data-theme="dark" data-density="cozy"> ... </html>
```

| Attribute        | Values                       |
| ---------------- | ---------------------------- |
| `data-theme`     | `light` (default), `sepia`, `dark` |
| `data-density`   | `cozy` (default), `compact`  |

Accent hue is set per-app by overriding `--bq-accent`,
`--bq-accent-soft`, and `--bq-accent-ink` on `:root`.

## Component inventory

### Atoms
- `bq-icon` — hairline-stroke SVG icons (today, capture, brain, search, back, close, check, arrow, dot, spark, link, filter, more, settings)
- `bq-type-glyph` — entity-type glyph (Person, Project, Commitment, Note, Idea)
- `bq-meta` — uppercase mono caption text
- `bq-chip` — pill-shaped filter / toggle
- `bq-ring` — circular progress ring
- `bq-heatmap` — activity heatmap grid
- `bq-icon-button` — round 36×36 icon target
- `bq-button` — `primary` | `ghost` text button
- `bq-name-init` — circular initials avatar
- `bq-progress-bar` — linear progress

### Molecules
- `bq-section-label` — uppercase header with optional count + action slot
- `bq-entity-row` — list item for an entity
- `bq-edge-chip` — typed relationship chip
- `bq-search-bar` — pill search input (md / lg)
- `bq-suggestion` — search-suggestion row
- `bq-toast` — bottom-anchored confirmation toast
- `bq-detail-card` + `bq-detail-card-row` — stat card with 3-up rows
- `bq-nudge` — "on your mind" prompt list item
- `bq-commitment-cell` — ring + title + meta cell
- `bq-capture-prompt` — "what's on your mind" entry button

### Organisms
- `bq-tab-bar` — fixed bottom nav with optional capture button
- `bq-sheet` — bottom modal sheet
- `bq-stat-band` — three-up bordered stats row
- `bq-app-shell` — max-width column shell + stage

## Design tokens

All components consume CSS custom properties only (no hardcoded colors,
spacing, or radii). The full token list lives in `src/styles/tokens.scss`:

- Surfaces: `--bq-bg`, `--bq-bg-soft`, `--bq-card`
- Lines: `--bq-line`, `--bq-line-soft`
- Ink: `--bq-ink`, `--bq-ink-soft`, `--bq-ink-dim`
- Accent: `--bq-accent`, `--bq-accent-soft`, `--bq-accent-ink`
- Type: `--bq-font-sans`, `--bq-font-mono`, `--bq-step-1..3`, `--bq-step-display-sm/--bq-step-display/--bq-step-display-lg`
- Spacing: `--bq-space-1..7`, `--bq-pad`
- Radii: `--bq-radius-sm`, `--bq-radius`, `--bq-radius-lg`, `--bq-radius-pill`
- Motion: `--bq-duration-fast`, `--bq-duration`, `--bq-ease`
- Layers: `--bq-z-tabbar`, `--bq-z-overlay`, `--bq-z-sheet`, `--bq-z-toast`

## Build

```bash
ng build components
```

Output is written to `dist/components`.
