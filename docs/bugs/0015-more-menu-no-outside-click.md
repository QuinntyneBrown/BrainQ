# Bug 0015 — Detail's More menu doesn't close on outside click

## Symptom

`DetailScreen` renders a small dropdown for the **More** affordance:

```html
<bq-icon-button (click)="toggleMenu()" data-testid="detail-more">…</bq-icon-button>
@if (menuOpen()) {
  <div class="more-menu" role="menu">
    <button (click)="delete()" data-testid="detail-delete">Delete</button>
  </div>
}
```

`toggleMenu()` flips `menuOpen` on every press of the More icon. There's no listener for clicks **outside** the `.more-wrap`, so once the menu is open the user has to either pick `Delete` or press More again to dismiss it. Clicking on the body, the title, the heatmap, an edge chip — none of those close the menu. That contradicts the universal dropdown convention browsers and OSes have set since menus were invented.

## Reproduction

1. Open any Commitment/Person/Project Detail screen.
2. Tap **More** → menu appears with `Delete`.
3. Tap anywhere outside the menu and outside the More button.
4. The menu stays open. The user has to tap More again.

## Failing test

A new unit assertion on `DetailScreen` opens the menu, dispatches a `pointerdown` on `document.body`, and asserts `menuOpen()` is `false`. Today the assertion fails because no outside-click handler exists.

## Fix

Inside `DetailScreen`:

1. Capture the menu wrapper element with `viewChild<ElementRef<HTMLElement>>('moreWrap')` and tag the `<div class="more-wrap">` with `#moreWrap`.
2. In an `effect()`, when `menuOpen()` flips to `true`, register a `pointerdown` listener on `document` that closes the menu when the click target is **outside** the wrapper. When `menuOpen()` flips to `false`, remove the listener.

Eight new lines, zero new abstractions, no SCSS change.

## Verification

- New unit test passes.
- Manual: open More, click anywhere → menu closes.

Status: Fixed in the next two commits.
