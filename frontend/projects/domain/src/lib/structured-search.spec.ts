import { BqEntity } from './models';
import { structuredSearch } from './structured-search';

const mk = (over: Partial<BqEntity>): BqEntity => ({
  id: over.id ?? 'x',
  type: 'Note',
  title: 'untitled',
  subtitle: '',
  body: '',
  meta: {},
  tags: [],
  edges: [],
  ...over,
});

describe('structuredSearch', () => {
  it('returns empty for blank query', () => {
    expect(structuredSearch([mk({ title: 'a' })], '')).toEqual([]);
  });

  it('ranks title hits higher than body hits', () => {
    const titleHit = mk({ id: 't', title: 'graph databases', body: 'unrelated' });
    const bodyHit = mk({ id: 'b', title: 'unrelated', body: 'graph databases here' });

    const result = structuredSearch([bodyHit, titleHit], 'graph');

    expect(result.map((e) => e.id)).toEqual(['t', 'b']);
  });

  it('matches against tags', () => {
    const tagHit = mk({ id: 'tag', title: 'unrelated', tags: ['graph'] });

    const result = structuredSearch([tagHit], 'graph');

    expect(result).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    const e = mk({ id: 'a', title: 'Graph Theory' });

    const result = structuredSearch([e], 'GRAPH');

    expect(result).toHaveLength(1);
  });
});
