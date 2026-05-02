# 3. Capture

Capture is the only way new things get into BrainQ. Tap the Capture button (centre tab disc on xs / md, side-rail row on xl) and the **Capture sheet** opens. The textarea auto-focuses, so you can type immediately.

## The sheet, top to bottom

1. **Header** — `CAPTURE` label and a close icon.
2. **Textarea** — your free-form text. The first line becomes the entity's title (truncated to 80 characters); the whole text becomes the body.
3. **Detected as** — the type BrainQ has inferred from your text, with the matching glyph.
4. **Type chips** — `auto`, `Note`, `Idea`, `Person`, `Project`, `Commitment`. While `auto` is selected, the type follows the inference. Tap any other chip to lock the type.
5. **Looks related to** — up to three existing entities BrainQ thinks share a token with what you're typing. Tap one later to wire it up; for now they're informational.
6. **Actions** — `Cancel` (ghost) and `Save to brain` (primary). The Save button is disabled while the textarea is empty.

## Type inference rules

The detected type is computed from your text, not from how you're feeling. It runs locally and only re-runs while `auto` is selected.

| Detected type | Triggered by |
|---|---|
| **Idea** | Words like *idea*, *what if*, *maybe I could*, *possibility* |
| **Commitment** | Phrases like *every day*, *daily*, *each week*, *commit*, *goal of* |
| **Person** | Verbs like *met*, *coffee with*, *called*, *emailed*, *birthday*, OR a Title-Cased First Last name pattern |
| **Project** | The words *project*, *ship*, *deadline*, *milestone* |
| **Note** | Anything that doesn't match the above (the default) |

When the inference is wrong, just tap the right chip — that locks your choice and the toast on save will reflect the locked type.

## Saving

Tap **Save to brain**. Three things happen at once:

1. The sheet closes.
2. A toast appears: `Saved as <type> · linked to your brain` for ~2.4 seconds.
3. The entity shows up immediately in **Today → Recently touched** and on the **Brain** screen.

The save is *optimistic*: BrainQ adds the entity locally before the server confirms. If the save fails, the optimistic entity is removed and a `Save failed — try again` toast replaces the success one.

## Validation

The server rejects:

- empty / whitespace-only text — `text required`
- unknown type — `unknown type '<value>'`
- a derived title over 200 characters — `title >200`
- text over 100 000 characters — `body >100000`

In practice the UI prevents the first one (Save is disabled) and the others almost never bite a human.

## What happens after save

Once an entity exists, you can:
- find it on **Brain** (filtered by its type or by substring),
- open it from any list to see its **Detail** screen,
- add or remove edges between it and others (via the API today; UI affordance lands in a future slice),
- delete it from the **More** menu on its Detail screen.

→ Next: [Today](today.md)
