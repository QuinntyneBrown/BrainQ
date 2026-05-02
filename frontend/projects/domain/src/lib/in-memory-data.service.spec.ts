import { TestBed } from '@angular/core/testing';
import { InMemoryBrainQDataService } from './in-memory-data.service';

describe('InMemoryBrainQDataService — slice 03 mutations', () => {
  let service: InMemoryBrainQDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [InMemoryBrainQDataService] });
    service = TestBed.inject(InMemoryBrainQDataService);
  });

  it('addEdge appends an outbound edge from source to target', () => {
    const a = service.capture({ type: 'Note', text: 'a' });
    const b = service.capture({ type: 'Note', text: 'b' });

    service.addEdge(a.id, b.id, 'mentions');

    const updated = service.byId(a.id);
    expect(updated?.edges).toContainEqual({ to: b.id, kind: 'mentions' });
    expect(service.inboundFor(b.id)).toContainEqual({ from: a.id, kind: 'mentions' });
  });

  it('removeEdge drops the matching outbound edge', () => {
    const a = service.capture({ type: 'Note', text: 'a' });
    const b = service.capture({ type: 'Note', text: 'b' });
    service.addEdge(a.id, b.id, 'mentions');

    service.removeEdge(a.id, b.id, 'mentions');

    expect(service.byId(a.id)?.edges).toEqual([]);
    expect(service.inboundFor(b.id)).toEqual([]);
  });

  it('removeEntity removes the entity and any edges referencing it', () => {
    const a = service.capture({ type: 'Note', text: 'a' });
    const b = service.capture({ type: 'Note', text: 'b' });
    service.addEdge(a.id, b.id, 'mentions');
    service.addEdge(b.id, a.id, 'relatesTo');

    service.removeEntity(a.id);

    expect(service.byId(a.id)).toBeUndefined();
    expect(service.byId(b.id)?.edges).toEqual([]);
    expect(service.inboundFor(b.id)).toEqual([]);
  });
});
