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
