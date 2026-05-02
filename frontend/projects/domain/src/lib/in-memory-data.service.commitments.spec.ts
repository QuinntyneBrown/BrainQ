import { TestBed } from '@angular/core/testing';
import { InMemoryBrainQDataService } from './in-memory-data.service';

describe('InMemoryBrainQDataService — slice 06 logCommitment', () => {
  let service: InMemoryBrainQDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [InMemoryBrainQDataService] });
    service = TestBed.inject(InMemoryBrainQDataService);
  });

  it('marks the commitment done and bumps the streak by 1', () => {
    const c = service.capture({ type: 'Commitment', text: 'Stretch' });

    service.logCommitment(c.id);

    const updated = service.byId(c.id);
    expect(updated?.meta.todayDone).toBe(true);
    expect(updated?.meta.streak).toBe(1);
  });

  it('logging twice the same day does not double-increment', () => {
    const c = service.capture({ type: 'Commitment', text: 'Walk' });

    service.logCommitment(c.id);
    service.logCommitment(c.id);

    expect(service.byId(c.id)?.meta.streak).toBe(1);
  });
});
