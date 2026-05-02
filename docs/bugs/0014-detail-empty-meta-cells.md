# Bug 0014 — Detail screen renders empty cells for unset Commitment / Person / Project meta

## Symptom

`detail.html` interpolates Commitment / Person / Project meta fields directly:

```html
<div class="bq-display-num">{{ e.meta.streak }}</div>
…
<div class="bq-display-num">{{ e.meta.target }}<span> {{ e.meta.unit }}</span></div>
…
<div class="bq-stat-mid">{{ e.meta.lastSeen }}</div>
```

For a freshly-captured Commitment, `meta` is `{}` until the server has activity to hydrate from. `e.meta.streak` is `undefined` and Angular renders the empty string, so the user sees a blank box where `0` should be:

```
streak     today     target
                ✓
```

The Today commitment cell already has the `?? 0` guard (`[streak]="c.meta.streak ?? 0"`), so the Today grid is correct; only the Detail card breaks.

The Person card has the same issue for `lastSeen`, `touchpoints`, `relationship`. The Project card for `status`, `due`. Each unset cell renders empty rather than a typographic placeholder.

## Reproduction

1. Capture a fresh Commitment (`Stretch daily`).
2. Open its Detail screen.
3. The streak cell shows nothing where `0` belongs. The target cell shows just `unit` with no number.

## Failing test

A unit test on `DetailScreen` seeds a fresh Commitment via the in-memory data service, opens Detail, and asserts:
- the streak cell text is `'0'` (not empty)
- the target cell text is `'0'` (when target is unset)

Today the assertions fail because the template renders empty.

## Fix

Add `?? 0` for numeric meta and `?? '—'` for textual meta in `detail.html`. Five small interpolation tweaks, no SCSS or component-class change.

| Cell | Was | Becomes |
|---|---|---|
| Commitment streak | `e.meta.streak` | `e.meta.streak ?? 0` |
| Commitment target | `e.meta.target` | `e.meta.target ?? 0` |
| Commitment unit | `e.meta.unit` | `e.meta.unit ?? ''` |
| Person lastSeen | `e.meta.lastSeen` | `e.meta.lastSeen ?? '—'` |
| Person touchpoints | `e.meta.touchpoints` | `e.meta.touchpoints ?? 0` |
| Person relationship | `e.meta.relationship` | `e.meta.relationship ?? '—'` |
| Project status | `e.meta.status` | `e.meta.status ?? '—'` |
| Project due | `e.meta.due` | `e.meta.due ?? '—'` |

`progress` already has its own `?? 0` in `progressPercent`, and `todayDone` already has a fallback in the truthy ternary.

## Verification

- New unit test passes.
- Manual: capture a fresh Commitment / Person / Project, open Detail; every meta cell shows a number or `—` instead of an empty box.

Status: Fixed in the next two commits.
