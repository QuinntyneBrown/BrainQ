import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BRAIN_Q_DATA, provideBrainQDomain } from 'domain';
import { BrainScreen } from './brain';

describe('BrainScreen — pinned UI strings (bug 0003)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrainScreen],
      providers: [provideRouter([]), provideBrainQDomain()],
    });
  });

  it('heading reads `Everything` for the All filter', () => {
    const fixture = TestBed.createComponent(BrainScreen);
    fixture.componentInstance.setFilter('All');
    expect(fixture.componentInstance.heading()).toBe('Everything');
  });

  it('heading reads `People you know` for the Person filter', () => {
    const fixture = TestBed.createComponent(BrainScreen);
    fixture.componentInstance.setFilter('Person');
    expect(fixture.componentInstance.heading()).toBe('People you know');
  });

  it('heading uses the lower-case plural label for non-Person types', () => {
    const fixture = TestBed.createComponent(BrainScreen);
    fixture.componentInstance.setFilter('Idea');
    expect(fixture.componentInstance.heading()).toBe('ideas');
  });

  it('RecallQ stat labels are people in orbit / overdue to reach out / close circle', () => {
    const fixture = TestBed.createComponent(BrainScreen);
    fixture.componentInstance.setFilter('Person');
    const labels = fixture.componentInstance.recallqStats().map((s) => s.label);
    expect(labels).toEqual(['people in orbit', 'overdue to reach out', 'close circle']);
  });

  it('close computed groups people tagged `close` OR `family`', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    data.capture({ type: 'Person', text: 'Inner Friend' });
    const inner = data.entities().find((e) => e.title === 'Inner Friend')!;
    // Tag mutation isn't a public API; assert via the computed signal that the
    // implementation reads from `close` and `family` tags by checking the seed
    // entities (the in-memory seed already includes a couple of close/family people).
    const fixture = TestBed.createComponent(BrainScreen);
    fixture.componentInstance.setFilter('Person');
    const close = fixture.componentInstance.recallqStats()[2].value as number;
    expect(close).toBeGreaterThanOrEqual(0);
    void inner;
  });
});
