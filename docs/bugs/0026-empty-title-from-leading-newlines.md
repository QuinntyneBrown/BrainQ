# Bug 0026 — `POST /api/entities` produces an empty title when text starts with a newline

## Symptom

`EntitiesController.FirstLineFrom` is:

```csharp
private static string FirstLineFrom(string text) =>
    text.Split('\n', 2)[0].Trim();
```

For `text = "\nhello"`, `Split('\n', 2)[0]` is the empty string before the first newline; `.Trim()` keeps it empty; `title` is empty. The body validation only checks `req.Text` for whitespace, not the derived title — so the entity persists with `title: ""`.

Frontend lists then render an empty title. `infer-type.ts.suggestRelated`'s `e.title.toLowerCase().split(' ')[0]` becomes `''`, and `someText.includes('')` is always `true`, so every empty-titled entity matches every capture text — silently polluting the suggestion list.

The capture sheet trims its textarea before submission, so the typical UI flow doesn't trigger this. But:
- Direct API callers (curl, e2e seed fixtures, future import tools) hit this.
- Pasted text whose first line is whitespace + content can trigger it depending on browser-trim behavior in copy/paste paths.

## Failing test

A new xUnit assertion: `POST /api/entities { type: "Note", text: "\n\nhello" }` returns 201 with `title == "hello"` (not empty). Today the assertion fails because `title == ""`.

## Fix

Walk the lines of the input and pick the first non-empty trimmed line:

```csharp
private static string FirstLineFrom(string text)
{
    foreach (var raw in text.Split('\n'))
    {
        var trimmed = raw.Trim();
        if (trimmed.Length > 0) return trimmed;
    }
    return "";
}
```

Then keep the existing `if (firstLine.Length > 200) → 400` check; if the entire body is whitespace-only the existing `string.IsNullOrWhiteSpace(req.Text) → "text required"` already catches it. Add a final guard for "no non-empty line found" returning the same `text required` error so the title can never be empty in a stored entity.

## Verification

- New xUnit case passes after the fix.
- Existing 34-test backend suite still green.

Status: Fixed in the next two commits.
