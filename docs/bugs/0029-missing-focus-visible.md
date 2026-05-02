# Bug 0029 — Many interactive components lack a `:focus-visible` outline

## Symptom

Only `bq-button` and `bq-icon-button` declare a `:focus-visible` outline. Every other interactive component — `bq-chip`, `bq-edge-chip`, `bq-entity-row`, `bq-suggestion`, `bq-nudge`, `bq-commitment-cell`, `bq-capture-prompt`, `bq-side-rail` items — is rendered as a `<button>` inside Angular's encapsulated SCSS, with `border: none` or `border: 1px solid var(--bq-line)`. The browser's default focus outline is hidden or hard to see against those borders, and the components don't restore an explicit ring.

`navigation.md` promises "visible focus rings make this safe" for keyboard users — today that promise holds for the two components above and roughly nowhere else.

The slice 08 design (L2-019 / accessibility) didn't enumerate this individually but the user-guide claim is the contract.

## Failing test

The test for a CSS-only cross-cutting change is awkward in vitest+jsdom (no real CSSOM, no node-types in the Angular spec tsconfig, and `:focus-visible` doesn't trigger reliably under jsdom). The pragmatic substitute is a manual repro: open Today at xl, Tab through every actionable control, and confirm a visible accent ring on each — failing today on filter chips, mode chips, edge chips, entity rows, suggestion buttons, nudges, the capture prompt, and side-rail items.

## Fix

Add one global rule to `frontend/projects/components/src/styles/base.scss`:

```scss
button:focus-visible {
  outline: 2px solid var(--bq-accent);
  outline-offset: 2px;
  border-radius: inherit;
}
```

That's the same shape `bq-button` and `bq-icon-button` already use individually. A global rule reaches buttons emitted from every component (Angular's `ViewEncapsulation.Emulated` doesn't sandbox global host-page styles) without touching each component's SCSS.

## Verification

- Snapshot/string test on `base.scss` passes after the rule lands.
- Manual: Tab through Today/Brain/Search at xl — every interactive control shows the accent outline.

Status: Fixed in the next two commits.
