# Bug 0028 — `InMemoryBrainQDataService.capture` produces a leading-newline title

## Symptom

`InMemoryBrainQDataService.capture` derives the title with:

```ts
title: payload.text.split('\n')[0].slice(0, 80) || payload.text,
```

For `text = "\nhello"`:
- `split('\n')[0]` → `""`
- `.slice(0, 80)` → `""` (falsy)
- `||` falls through → `payload.text` → `"\nhello"`

So the cached entity carries `title: "\nhello"` (with the leading newline). When rendered by `bq-entity-row`, the `<span class="title">` displays empty space because of the leading `\n` — a quieter version of bugs 0026 / 0027.

The HTTP impl's `titleFrom` was just patched in bug 0027 to walk lines; the in-memory impl still has its own inline derivation. Two impls of the same logic — they should share a util like `inferType` and `structuredSearch` already do (bug 0025 pattern).

## Failing test

A unit test on `InMemoryBrainQDataService.capture` calls `data.capture({ type: 'Note', text: '\n\nhello' })` and asserts the returned entity's title is exactly `'hello'`. Today the assertion fails because the title contains the leading newline.

## Fix

1. Add `domain/lib/title-from.ts` exporting one pure helper:

   ```ts
   export function titleFrom(text: string, max = 80): string {
     for (const raw of text.split(/\r?\n/)) {
       const trimmed = raw.trim();
       if (trimmed.length > 0) return trimmed.slice(0, max);
     }
     return '';
   }
   ```

2. Re-export from the public-api.

3. Replace both `InMemoryBrainQDataService.capture`'s inline title and `HttpBrainQDataService.makeOptimistic`'s `titleFrom` body with calls to the shared util.

## Verification

- New unit test passes.
- 97 existing tests stay green.

Status: Fixed in the next two commits.
