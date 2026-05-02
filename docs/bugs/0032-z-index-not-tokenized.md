# Bug 0032 — Tweaks panel and health banner z-indexes are hardcoded, not tokenized

## Symptom

`tokens.scss` allocates four z-index slots:

```scss
--bq-z-tabbar: 30;
--bq-z-overlay: 20;
--bq-z-sheet: 60;
--bq-z-toast: 80;
```

But `tweaks-panel.scss` writes `z-index: 200;` and `app.scss` writes `z-index: 300;` directly. New surfaces sit above the tokenized layers without being part of the layer system, so a future engineer adding a modal can't predict where it should go relative to Tweaks/banner without reading every SCSS file.

## Failing test

CSS-only consistency hygiene; same vitest+jsdom limitation as the other a11y CSS fixes. Manual repro: grep the source for `z-index:` and see two non-tokenized literals (200, 300) sitting alongside four tokenized ones.

## Fix

Add two tokens to `tokens.scss`:

```scss
--bq-z-tweaks: 200;
--bq-z-banner: 300;
```

…then point `tweaks-panel.scss` and `app.scss` at them.

## Verification

- `grep -E 'z-index:\s*\d+' frontend/projects/**/*.scss` returns only `var(--bq-z-…)` references after the fix.
- 105 existing tests stay green (CSS-only, no behavioural shift).

Status: Fixed in the next two commits.
