# Bug 0018 — Today nudges are not keyboard-accessible

## Symptom

`BqNudge` renders the nudge as an `<li>` with a click handler:

```html
<li class="nudge" (click)="open.emit()">
  <span class="mark"></span>
  <span class="text">{{ text() }}</span>
  …
</li>
```

`<li>` is not focusable by default and has no built-in click affordance for keyboard users. Tab cycles past it; Enter/Space don't fire the click. A keyboard-only user can't open a nudge from the Today screen — every other actionable element on Today (capture prompt, commitment cells, recently-touched rows) is a `<button>`, so this is the one outlier.

The design file (`docs/design-files/screens.jsx`) has the same `<li onClick>` pattern; the implementation can do better than the design without breaking the visual contract.

## Reproduction

1. Open Today in a browser.
2. Press Tab repeatedly until focus moves through all interactive controls.
3. Focus never lands on a nudge. Pressing Enter while the nudge is visible does nothing.

## Failing test

A unit test on `BqNudge` mounts the component, asserts the host's actionable element is a `<button type="button">` (not an `<li>`), and dispatches a `click` to confirm the `open` event fires. Today the assertion fails because the rendered template root is an `<li>`.

## Fix

Swap `<li>` for `<button type="button">` in `nudge.html`. The parent `<ul class="nudges">` already wraps each nudge in a `<bq-nudge>` custom element (HTML-permissive), so the rendered tree was never strictly `<ul><li>` anyway; turning the inner element into a button gives keyboard users Enter/Space activation, focus-ring rendering, and the same click semantics. The SCSS needs a tiny tweak to reset the button's default appearance, but no layout change.

## Verification

- Unit test passes: rendered actionable is `<button>`, `click` fires `open`.
- Manual: Tab onto a nudge → focus ring appears → Enter opens its target Detail.

Status: Fixed in the next two commits.
