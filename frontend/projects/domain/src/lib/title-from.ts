/**
 * Pick the first non-empty trimmed line from `text` and clamp to `max` chars.
 * Used by both data-service impls (and matches the server's FirstLineFrom)
 * so an entity's title is never the empty string nor a leading newline.
 */
export function titleFrom(text: string, max = 80): string {
  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (trimmed.length > 0) return trimmed.slice(0, max);
  }
  return '';
}
