# Bug 0030 — `bq-search-bar` input strips its focus outline with no replacement

## Symptom

`search-bar.scss` declares:

```scss
.input {
  …
  outline: none;
  …
}
```

…and never restores a focus indicator on the wrapping `.search` pill. Tabbing into the search bar is invisible — there's no border change, no ring, no outline anywhere. This is the same accessibility regression bug 0029 fixed for `<button>`s, but on the native `<input>` that the global `button:focus-visible` rule doesn't cover.

The Brain screen, Search screen, and any future screen that mounts `bq-search-bar` all suffer.

## Failing test

CSS focus styles are awkward to assert in vitest+jsdom. The pragmatic substitute is the same as bug 0029: a manual repro — Tab onto the search bar at any viewport and confirm a visible accent ring on the wrapping pill. Today no ring appears.

## Fix

Move the visible-focus indicator from the input to the wrapping pill via `:focus-within`:

```scss
.search:focus-within {
  outline: 2px solid var(--bq-accent);
  outline-offset: 2px;
}
```

Keep the `.input { outline: none }` since the wrapper now carries the focus styling. This is design-coherent — the pill itself reads as "active" while the cursor blinks inside.

## Verification

- Manual repro: Tab into the Brain or Search screen, the pill grows an accent ring; Tab away, the ring vanishes.
- 105 existing tests stay green (CSS-only change, no behavioural shift).

Status: Fixed in the next two commits.
