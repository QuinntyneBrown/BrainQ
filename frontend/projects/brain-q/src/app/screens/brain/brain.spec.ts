import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideBrainQDomain } from 'domain';
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

});
