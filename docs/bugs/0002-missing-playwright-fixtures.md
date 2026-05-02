# Bug 0002 — e2e specs reference a non-existent `fixtures.ts`

## Symptom

All seven Playwright spec files under `frontend/e2e/specs/` open with:

```ts
import { expect, test } from '../fixtures';
```

…but no `frontend/e2e/fixtures.ts` exists. Trying to run the specs (`npx playwright test`) fails to resolve the import, so the slice 02–08 acceptance suites can't run end-to-end. There is also no `playwright.config.ts` and no `@playwright/test` dependency in `frontend/package.json`.

## Reproduction

```
cd frontend
npx playwright test
# → Error: Cannot find module '../fixtures'
```

Every spec file (`02-browse`, `03-detail-edges`, `04-semantic-search`, `05-today`, `06-commitment-activity`, `07-tweaks`, `08-ops`) is stuck at the import.

## Fix

Add the three missing pieces:

1. `frontend/e2e/fixtures.ts` exporting a `test` whose `brainq` fixture exposes the page objects every spec already uses (`brainq.app`, `brainq.today`, `brainq.brain`, `brainq.search`, `brainq.detail`, `brainq.capture`, `brainq.tweaks`) and a `seedEntity` fixture that hits `POST /api/entities` for setup.
2. `frontend/playwright.config.ts` pointing at `e2e/specs`, with viewport projects for `xs` (375), `md` (768), `xl` (1440), and a `webServer` block that runs `ng serve --port 4201` so the SPA is up during tests.
3. The Playwright POM index — `app.page.ts` and `capture-sheet.page.ts` are referenced by specs but don't exist. Add the two missing POMs.
4. `npm install --save-dev @playwright/test` in `frontend/package.json`.

The fixture file is the bare minimum needed to make the existing specs compile; tests still depend on a running backend + frontend, which is now bootable thanks to bug 0001's docker-compose.

## Verification

After the fix:

```
cd frontend
npx playwright install   # one-time browser download
npx playwright test --list
# → all 7 specs enumerate without import errors
```

Running the specs to green requires the docker-compose stack from bug 0001 to be up.

Status: Fixed in the same commit as this entry.
