# Bug 0024 — Tweaks panel doesn't close on outside click

## Symptom

`BqTweaksPanel.toggle()` flips `open` on every press of the cog. Like the Detail More menu before bug 0015, there's no listener for clicks **outside** the panel — once it's open, the user has to either tap a swatch / segment / cog again to dismiss it. The cog sits in the bottom-right of every screen, so an open panel can occlude the Tab bar at xs/md viewports until manually closed.

The fix is the exact pattern that landed for bug 0015: a `viewChild` on the wrapper + an `effect` that mounts/unmounts a document `pointerdown` listener tied to `open()`.

## Reproduction

A new unit test on `BqTweaksPanel` toggles the panel open, dispatches a `pointerdown` on `document.body`, and asserts `open()` flips back to `false`. Today the assertion fails — `open()` stays `true`.

## Fix

```ts
private readonly wrap = viewChild<ElementRef<HTMLElement>>('wrap');

constructor() {
  effect((onCleanup) => {
    if (!this.open()) return;
    const el = this.wrap()?.nativeElement;
    const onPointerDown = (e: PointerEvent) => {
      if (el && !el.contains(e.target as Node)) this.open.set(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    onCleanup(() => document.removeEventListener('pointerdown', onPointerDown));
  });
}
```

…plus a `#wrap` template ref on the `<div class="tweaks">` root. Six new lines, no SCSS or template-restructure beyond the ref.

## Verification

- New unit test passes.
- Manual: open Tweaks, click anywhere → panel closes.

Status: Fixed in the next two commits.
