# Bug 0027 — `HttpBrainQDataService` optimistic title is empty for leading-newline text

## Symptom

`HttpBrainQDataService` builds an optimistic entity client-side via:

```ts
function titleFrom(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0]?.trim() ?? text;
  return firstLine.slice(0, 80);
}
```

For `text = "\nhello"`, `split(...)[0]` is `""`, `.trim()` is `""`, the slice is `""`. The optimistic entity has `title: ""`. The user sees a blank row in the cache for the brief window before the server's response replaces it (the server now correctly derives `"hello"` per the bug 0026 fix).

`InMemoryBrainQDataService.capture` already has a `|| payload.text` fallback so it never produces empty:

```ts
title: payload.text.split('\n')[0].slice(0, 80) || payload.text,
```

The HTTP impl's helper has no equivalent guard.

## Failing test

A unit test on `HttpBrainQDataService.capture` (mocked HTTP) seeds the cache, calls `data.capture({ type: 'Note', text: '\n\nhello' })`, and asserts the **synchronously-returned** optimistic entity's title is `'hello'` (not empty). Today the assertion fails because `titleFrom('\n\nhello')` yields `''`.

## Fix

Replace the helper's first-segment lookup with the same line-walk pattern bug 0026's `FirstLineFrom` adopted on the server:

```ts
function titleFrom(text: string): string {
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.length > 0) return trimmed.slice(0, 80);
  }
  return '';
}
```

The user only sees an empty optimistic title if the entire input is whitespace — which the capture sheet's `txt = this.text().trim()` already prevents at the source.

## Verification

- New unit test passes.
- 96 existing tests stay green.

Status: Fixed in the next two commits.
