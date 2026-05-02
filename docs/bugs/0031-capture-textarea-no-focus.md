# Bug 0031 — Capture sheet textarea has no visible focus indicator

## Symptom

`capture-sheet.scss` declares `outline: none` on `.capture-input` (the textarea) without restoring a visible focus indicator anywhere. The textarea is auto-focused on sheet open (the cursor is visible), but if the user Tabs to a chip / button and then Tabs back to the textarea, there's no clear visual cue that focus has returned — same a11y shape as bug 0030 on the search-bar input.

## Failing test

Same vitest+jsdom limitation as bugs 0029 / 0030 — `:focus-visible` doesn't render reliably under jsdom. Manual repro: open Capture, Tab off the textarea onto a type chip, then Shift+Tab back. No visible indicator on the textarea today.

## Fix

Switch the textarea's bottom border from `--bq-line-soft` to `--bq-accent` on `:focus-visible`:

```scss
.capture-input {
  …
  &:focus-visible {
    border-bottom-color: var(--bq-accent);
  }
}
```

The existing `border-bottom: 1px solid var(--bq-line-soft)` becomes the resting visual; focus colors it accent. No layout shift, no outline that fights the typography. Matches the design system's preference for inline focus signals over outlines on text inputs.

## Verification

- Manual: focus the textarea via Tab (not auto-focus), the bottom underline goes accent; Tab away, underline returns to soft line.
- 105 existing tests stay green (CSS-only).

Status: Fixed in the next two commits.
