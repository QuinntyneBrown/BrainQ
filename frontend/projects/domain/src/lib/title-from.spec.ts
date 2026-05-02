import { titleFrom } from './title-from';

describe('titleFrom', () => {
  it('returns empty string for empty input', () => {
    expect(titleFrom('')).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(titleFrom('   \n  \n  ')).toBe('');
  });

  it('skips leading empty lines', () => {
    expect(titleFrom('\n\nhello')).toBe('hello');
  });

  it('skips leading whitespace-only lines', () => {
    expect(titleFrom('   \n  \nhello')).toBe('hello');
  });

  it('trims the chosen line', () => {
    expect(titleFrom('  spaced  \nignored')).toBe('spaced');
  });

  it('clamps to the max length', () => {
    const long = 'a'.repeat(100);
    expect(titleFrom(long).length).toBe(80);
    expect(titleFrom(long, 10).length).toBe(10);
  });

  it('handles \\r\\n line endings', () => {
    expect(titleFrom('\r\n\r\nhello\r\nworld')).toBe('hello');
  });
});
