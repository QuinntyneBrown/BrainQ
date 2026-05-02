# Bug 0006 — Side rail and user guide promise an `N` shortcut that is never bound

## Symptom

The side-rail Capture button paints a small `N` kbd badge:

```html
<button class="capture-btn" ...>
  <bq-icon name="capture" />
  <span>{{ captureLabel() }}</span>
  <span class="kbd">{{ captureKbd() }}</span>   <!-- captureKbd default = 'N' -->
</button>
```

`docs/user-guide/navigation.md` reinforces it:

| Key | Action |
|---|---|
| `N` | Open Capture sheet (xl only — see the side rail label) |

…but no `keydown` listener anywhere in `frontend/` listens for `n`. Pressing the key does nothing. The side rail and the user guide silently lie about a shortcut that isn't implemented.

## Reproduction

1. Boot the SPA (xl viewport).
2. Confirm the side-rail Capture button is visible with the `N` kbd badge.
3. Press `N` (with focus on the page body, no input focused).
4. Capture sheet does **not** open.

## Failing test

A new unit test on `App` dispatches a `KeyboardEvent('keydown', { key: 'n' })` on `document` and asserts `AppShellState.captureOpen()` flips to `true`. Today the assertion fails because nothing flips the state.

A second negative-case test confirms the shortcut is suppressed when an `<input>` or `<textarea>` is focused (so typing `n` into the capture textarea doesn't toggle the very sheet it's inside).

## Fix

Add a single `effect()`-registered `keydown` listener in `App`'s constructor:

```ts
constructor() {
  // …existing toast effect, health.check loop…
  if (typeof window !== 'undefined') {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return;
      const target = e.target as HTMLElement | null;
      if (target?.matches('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      this.shell.openCapture();
    };
    window.addEventListener('keydown', handler);
  }
}
```

Three guards keep it surprise-free: only `n`/`N`, only when no editable element is focused, and `preventDefault` so the keystroke doesn't also land in something the browser focuses next.

## Verification

- Unit test passes after the fix.
- Manual: open the SPA, hit `N` from the body, the sheet opens; click into the textarea, type `noted`, the sheet does not toggle on each keystroke.

Status: Fixed in the next two commits.
