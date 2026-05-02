import { BqEntity } from './models';
import { inferType, suggestRelated } from './infer-type';

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

describe('inferType', () => {
  it('returns Note for empty text', () => {
    expect(inferType('')).toBe('Note');
  });

  it('detects Idea keywords', () => {
    expect(inferType('what if I tried this idea')).toBe('Idea');
  });

  it('detects Commitment by cadence keywords', () => {
    expect(inferType('read 30 minutes daily')).toBe('Commitment');
  });

  it('detects Person by relational verbs', () => {
    expect(inferType('coffee with Iris next week')).toBe('Person');
  });

  it('detects Person by Title Last Name pattern', () => {
    expect(inferType('Nadia Cole sent the brief')).toBe('Person');
  });

  it('detects Project by milestone keywords', () => {
    expect(inferType('ship the project by deadline')).toBe('Project');
  });

  it('falls back to Note', () => {
    expect(inferType('a passing thought')).toBe('Note');
  });
});

describe('suggestRelated', () => {
  it('returns empty for blank text', () => {
    expect(suggestRelated([mk({ id: 'a' })], '')).toEqual([]);
  });

  it('matches by first word of title', () => {
    const e = mk({ id: 'a', title: 'Iris Okafor' });
    expect(suggestRelated([e], 'thinking about iris and seams')).toHaveLength(1);
  });

  it('matches by tag', () => {
    const e = mk({ id: 'a', title: 'Note', tags: ['seams'] });
    expect(suggestRelated([e], 'thinking about seams')).toHaveLength(1);
  });

  it('respects the limit parameter', () => {
    const a = mk({ id: 'a', title: 'iris one' });
    const b = mk({ id: 'b', title: 'iris two' });
    const c = mk({ id: 'c', title: 'iris three' });
    expect(suggestRelated([a, b, c], 'iris', 2)).toHaveLength(2);
  });
});
