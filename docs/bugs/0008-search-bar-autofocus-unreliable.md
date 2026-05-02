# Bug 0008 — `bq-search-bar [autofocus]` doesn't reliably focus on route navigation

## Symptom

`SearchScreen` sets `[autofocus]="true"` on its `bq-search-bar`. The component implements that input by writing the HTML `autofocus` attribute on the `<input>`:

```html
<input
  class="input"
  [placeholder]="placeholder()"
  [value]="value()"
  (input)="onInput($event)"
  [attr.autofocus]="autofocus() ? '' : null"
/>
```

The HTML `autofocus` attribute only triggers focus on the **first** parse of the document by the browser. When Angular routes to `/search` later, the search bar is added to an already-loaded DOM, the attribute does nothing, and the cursor doesn't land in the input. The user has to click before they can type.

## Reproduction

1. Open the SPA, land on `/today`.
2. Click the **Search** tab in the side rail (xl) or tab bar (xs/md).
3. The query bar shows the placeholder `Describe what you're looking for…` (semantic) or `name, word, or tag` (structured).
4. Start typing. Nothing happens — focus is still on the tab button.

## Failing test

A unit test on `BqSearchBar` mounts the component with `autofocus=true` and asserts `document.activeElement` is the rendered `<input>`. Today the assertion fails because the input is never imperatively focused.

## Fix

Inside `BqSearchBar`:

1. Capture the input element with `viewChild<ElementRef<HTMLInputElement>>('input')`.
2. In an `afterNextRender(...)` block (so the DOM is committed), if `autofocus()` is true, call `.focus()` on the captured ref.

Three lines, no SCSS change, no template restructure. Keep the `[attr.autofocus]` write as a belt-and-braces hint for the very first page load (no harm).

## Verification

- New unit test passes after the fix.
- Manual: Navigate to `/search`, the cursor blinks in the query input without a click.

Status: Fixed in the next two commits.
