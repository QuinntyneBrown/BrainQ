# Bug 0033 — Playwright 1.59 upgrade broke 9 e2e tests

## Symptom

Running `npx playwright test --project=xl` fails 9 specs, all with one of two
new strict-mode rules introduced in Playwright 1.50+:

1. **`.fill()` on a wrapper component no longer drills into nested `<input>`.**
   `pom/brain.page.ts` and `pom/search.page.ts` return the `<bq-search-bar>`
   custom-element host. `.fill('iris')` errors:
   `Element is not an <input>, <textarea>, <select> or [contenteditable]`.

2. **`.toContainText(string)` on a multi-element locator is now a strict-mode
   violation.** Several specs assert `expect(rows).toContainText('Iris')`
   against a list selector that resolves to N entity rows.

A third regression is independent of the upgrade:

3. `08-ops.spec.ts` calls `brainq.detail.open(e.id)` without first navigating
   to a screen that lists the entity, so the brain-row testid never appears.

## Failing test

The full suite. After running `npm install` (which pulled Playwright 1.59.1
under the `^1.49.0` constraint), 9 tests across `02`, `03`, `04`, `05`, `08`
fail. The new `99-feature-tour.spec.ts` is a fresh failing test that exercises
the same surfaces.

## Fix

- POMs return the inner `<input>`:
  `getByTestId('brain-search').locator('input')` for `BrainPage.search()`
  and `getByTestId('search-input').locator('input')` for `SearchPage.input()`.
- Spec-level: replace `.toContainText(string)` over multi-element locators
  with `.first()` (the user-guide-matching semantics — "any row contains X").
- `08-ops.spec.ts` XSS test: navigate to `/brain` before `detail.open(e.id)`.

## Verification

- `npx playwright test --project=xl` is fully green.
- `99-feature-tour.spec.ts` passes without per-spec workarounds.

Status: Fixed in the next two commits.
