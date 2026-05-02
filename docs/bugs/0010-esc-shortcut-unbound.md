# Bug 0010 — `Esc` shortcut documented but never bound

## Symptom

`docs/user-guide/navigation.md` lists:

| Key | Action |
|---|---|
| `N` | Open Capture sheet (…)|
| `Esc` | Close the Capture sheet or the More menu |

The `N` shortcut was wired up by [bug 0006](0006-n-keyboard-shortcut-unbound.md). `Esc` is still unbound. Nothing in `App`, `CaptureSheet`, `BqSheet`, or `DetailScreen` listens for `keydown` Escape; the menu/sheet only close via their explicit close affordances (Cancel/close-icon for the sheet, click-elsewhere for the menu).

## Reproduction

1. Press `N` → capture sheet opens (good).
2. Press `Esc`.
3. Sheet stays open. Documented behaviour fails.

## Failing test

A unit test on `App` opens the capture sheet via `AppShellState.openCapture()`, dispatches `keydown` `Escape` on `window`, and asserts `captureOpen()` flips back to `false`. Today the sheet stays open.

## Fix

Extend the existing `onKeydown` handler in `App` (the same one that listens for `n`/`N`):

```ts
if (e.key === 'Escape') {
  if (this.shell.captureOpen()) {
    this.shell.closeCapture();
    e.preventDefault();
  }
  return;
}
```

The More menu doesn't get Escape handling in this iteration — it's an in-component dropdown on `DetailScreen` whose closure is already triggered by selecting Delete or by re-tapping More. The user guide is updated accordingly so the documented Esc behaviour matches what we ship.

## Verification

- New unit test passes.
- Manual: press `N`, sheet opens; press `Esc`, sheet closes.

Status: Fixed in the next two commits.
