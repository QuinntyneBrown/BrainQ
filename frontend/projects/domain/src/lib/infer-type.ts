import { BqEntity, BqEntityType } from './models';

/**
 * Heuristic type inference from free-form capture text. Pure function — both
 * data-service impls share it so a heuristic tweak lands in one place.
 */
export function inferType(text: string): BqEntityType {
  const t = text.toLowerCase().trim();
  if (!t) return 'Note';
  if (/\b(idea|what if|maybe i could|possibility)\b/.test(t)) return 'Idea';
  if (/\b(every day|daily|each week|commit|goal of)\b/.test(t)) return 'Commitment';
  if (
    /\b(met|coffee with|called|emailed|birthday)\b/.test(t) ||
    /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text)
  )
    return 'Person';
  if (/\bproject\b|\bship\b|\bdeadline\b|\bmilestone\b/.test(t)) return 'Project';
  return 'Note';
}

/**
 * Up to `limit` existing entities that look related to the capture text —
 * matched by first word of title or by tag substring. Pure function.
 */
export function suggestRelated(
  entities: readonly BqEntity[],
  text: string,
  limit = 3,
): readonly BqEntity[] {
  const txt = text.trim();
  if (!txt) return [];
  const words = txt.toLowerCase();
  return entities
    .filter(
      (e) =>
        words.includes(e.title.toLowerCase().split(' ')[0]) ||
        (e.tags || []).some((tag) => words.includes(tag)),
    )
    .slice(0, limit);
}
