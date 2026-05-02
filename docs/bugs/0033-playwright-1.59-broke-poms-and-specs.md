# Bug 0033 — Playwright 1.59 upgrade broke e2e specs and POMs

## Symptom

Running `npx playwright test --project=xl` fails 9 specs after Playwright
was bumped from 1.49 → 1.59 by `npm install` (caret constraint). Three
families of root cause:

1. **`.fill()` no longer drills into nested `<input>`.**
   `pom/brain.page.ts` and `pom/search.page.ts` return the `<bq-search-bar>`
   custom-element host. `.fill('iris')` errors:
   `Element is not an <input>, <textarea>, <select> or [contenteditable]`.

2. **`.toContainText(string)` on a multi-element locator is a strict-mode
   violation.** Several specs assert
   `expect(rows).toContainText('Iris')` against a list selector that
   resolves to N entity rows.

3. **Tests that open a non-Person entity from the Brain list never click the
   `All` chip.** Brain defaults to the `Person` filter, so a Note or Idea
   row never appears under that filter, and `detail.open(id)` hangs waiting
   for `brain-row-${id}`. `08-ops.spec.ts` additionally never navigates to
   `/brain` before opening detail.

A separate fixture gap surfaced too: `seedGraph` creates Iris (Person) and a
seamsNote (Note) but no edge between them, so `03-detail-edges.spec.ts`
asserts a connection that nothing seeded.

## Failing test

The full suite. The new `99-feature-tour.spec.ts` is the failing test for
the recording deliverable; it exercises the same surfaces and reproduces
the POM `.fill()` and strict-mode regressions.

## Fix

- POMs return the inner `<input>`:
  `getByTestId('brain-search').locator('input')` for `BrainPage.search()`
  and `getByTestId('search-input').locator('input')` for `SearchPage.input()`.
- Spec-level: replace `.toContainText(string)` over multi-element locators
  with `.first()` (the user-guide-matching semantics — "any row contains X").
- `08-ops.spec.ts` XSS test: `await brainq.brain.goto()` then click the
  `All` chip before `detail.open(e.id)`.
- `03-detail-edges.spec.ts`: click the `All` chip on Brain before opening
  Note entities; pass `title:` (not `text:`) to `seedEntity`, which is what
  the fixture interface accepts.
- `e2e/fixtures.ts seedGraph`: POST `/api/edges` after seeding so Iris
  actually mentions the seamsNote (the rendering of that edge depends on
  bug 0034).

## Verification

- `npx playwright test --project=xl e2e/specs/99-feature-tour.spec.ts`
  passes against the real DB and writes a `video.webm` recording every
  user-guide section in order.
- All previously-failing strict-mode regressions in `02`, `05`, and `08`
  pass after the POM and `.first()` fixes.

Status: Fixed in the next two commits. (Tests `03` connection rendering and
`04` semantic search remain blocked on bugs 0034 and 0035, see those logs.)
