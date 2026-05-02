import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BRAIN_Q_DATA } from './brain-q-data.service';
import { provideBrainQHttpDomain } from './provide-domain';

describe('HttpBrainQDataService.heatmapFor — bug 0011 dedupe', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    // Construction triggers /api/entities + /api/today hydration.
    TestBed.inject(BRAIN_Q_DATA);
    httpMock.expectOne('/api/entities').flush([]);
    httpMock.expectOne('/api/today').flush({
      date: '',
      greeting: '',
      prompt: '',
      recent: [],
      nudges: [],
    });
  });

  afterEach(() => httpMock.verify());

  it('two calls before the first response queue exactly one outstanding request', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const id = '11111111-1111-1111-1111-111111111111';

    data.heatmapFor(id);
    data.heatmapFor(id);

    const reqs = httpMock.match(
      (r) => r.url === `/api/commitments/${id}/activity` && r.params.get('weeks') === '18',
    );
    expect(reqs.length).toBe(1);
    reqs[0].flush({ cells: [] });
  });

  it('after the response lands, subsequent calls return the cached map and fire no requests', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const id = '22222222-2222-2222-2222-222222222222';

    data.heatmapFor(id);
    httpMock.expectOne(`/api/commitments/${id}/activity?weeks=18`).flush({ cells: [[1, 0, 0, 0, 0, 0, 0]] });

    const map = data.heatmapFor(id);
    expect(map[0][0]).toBe(1);
    httpMock.expectNone(`/api/commitments/${id}/activity?weeks=18`);
  });
});

describe('HttpBrainQDataService — mutation failures bump the toast counter (bug 0012)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(BRAIN_Q_DATA);
    httpMock.expectOne('/api/entities').flush([]);
    httpMock.expectOne('/api/today').flush({
      date: '',
      greeting: '',
      prompt: '',
      recent: [],
      nudges: [],
    });
  });

  afterEach(() => httpMock.verify());

  it('removeEntity failure bumps the failure counter', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const before = data.mutationFailures();

    data.removeEntity('00000000-0000-0000-0000-000000000000');
    httpMock
      .expectOne('/api/entities/00000000-0000-0000-0000-000000000000')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(data.mutationFailures()).toBe(before + 1);
  });

  it('logCommitment failure bumps the failure counter', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const before = data.mutationFailures();

    data.logCommitment('00000000-0000-0000-0000-000000000000');
    httpMock
      .expectOne('/api/commitments/00000000-0000-0000-0000-000000000000/log')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(data.mutationFailures()).toBe(before + 1);
  });
});

describe('HttpBrainQDataService.search — stale response (bug 0013)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(BRAIN_Q_DATA);
    httpMock.expectOne('/api/entities').flush([]);
    httpMock.expectOne('/api/today').flush({
      date: '',
      greeting: '',
      prompt: '',
      recent: [],
      nudges: [],
    });
  });

  afterEach(() => httpMock.verify());

  it('older response does not overwrite the latest query results', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const oldEntity = mkEntity('a', 'old result');
    const newEntity = mkEntity('b', 'new result');

    data.search('abc', 'semantic');
    data.search('xyz', 'semantic');

    const abcReq = httpMock.expectOne((r) => r.url === '/api/search' && r.params.get('q') === 'abc');
    const xyzReq = httpMock.expectOne((r) => r.url === '/api/search' && r.params.get('q') === 'xyz');

    // The newer query's response lands first…
    xyzReq.flush([{ entity: newEntity }]);
    // …then the older query's response, late, must NOT overwrite the newer one.
    abcReq.flush([{ entity: oldEntity }]);

    const visible = data.search('xyz', 'semantic');
    expect(visible.map((e) => e.id)).toEqual(['b']);
  });
});

function mkEntity(id: string, title: string) {
  return {
    id,
    type: 'Note' as const,
    title,
    subtitle: '',
    body: '',
    meta: {},
    tags: [],
    edges: [],
  };
}

describe('HttpBrainQDataService.capture — optimistic title (bug 0027)', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(BRAIN_Q_DATA);
    httpMock.expectOne('/api/entities').flush([]);
    httpMock.expectOne('/api/today').flush({
      date: '',
      greeting: '',
      prompt: '',
      recent: [],
      nudges: [],
    });
  });

  afterEach(() => httpMock.verify());

  it('uses the first non-empty line for the optimistic title', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const optimistic = data.capture({ type: 'Note', text: '\n\nhello world' });
    expect(optimistic.title).toBe('hello world');

    // Drain the POST and the refresh() that fires on success.
    httpMock.expectOne('/api/entities').flush(optimistic);
    httpMock.match((r) => r.url === '/api/entities').forEach((r) => r.flush([]));
    httpMock.match((r) => r.url === '/api/today').forEach((r) =>
      r.flush({ date: '', greeting: '', prompt: '', recent: [], nudges: [] }),
    );
  });
});
