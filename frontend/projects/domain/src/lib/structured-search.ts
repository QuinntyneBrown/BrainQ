import { BqEntity } from './models';

/**
 * Substring + tag scoring across the in-memory entity list.
 * Title hits weigh 3, body hits 2, tag hits 1; ties retain input order.
 */
export function structuredSearch(entities: readonly BqEntity[], query: string): readonly BqEntity[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return entities
    .map((e) => {
      let score = 0;
      if (e.title.toLowerCase().includes(q)) score += 3;
      if ((e.body || '').toLowerCase().includes(q)) score += 2;
      if ((e.tags || []).some((t) => t.toLowerCase().includes(q))) score += 1;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}
