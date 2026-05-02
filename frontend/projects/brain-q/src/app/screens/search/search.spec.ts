import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BRAIN_Q_DATA, provideBrainQHttpDomain } from 'domain';
import { SearchScreen } from './search';

describe('SearchScreen — slice 04 semantic vs structured', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchScreen],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    // Inject BRAIN_Q_DATA so the http service constructs and fires hydration.
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

  it('semantic mode hits GET /api/search?q=...', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const fixture = TestBed.createComponent(SearchScreen);
    fixture.detectChanges();

    fixture.componentInstance.setMode('semantic');
    fixture.componentInstance.query.set('graph database');
    void data.search('graph database', 'semantic');
    fixture.detectChanges();

    const req = httpMock.expectOne(
      (r) => r.url === '/api/search' && r.params.get('q') === 'graph database',
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('structured mode does NOT hit /api/search', () => {
    const data = TestBed.inject(BRAIN_Q_DATA);
    const fixture = TestBed.createComponent(SearchScreen);
    fixture.detectChanges();

    fixture.componentInstance.setMode('structured');
    fixture.componentInstance.query.set('graph');
    void data.search('graph', 'structured');
    fixture.detectChanges();

    httpMock.expectNone((r) => r.url.includes('/api/search'));
  });

  it('renders the suggestion list when query is empty', () => {
    const fixture = TestBed.createComponent(SearchScreen);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="search-suggestion-0"]')).toBeTruthy();
  });

  it('debounces semantic queries — three rapid keystrokes → one request (bug 0022)', async () => {
    const fixture = TestBed.createComponent(SearchScreen);
    fixture.detectChanges();
    const cmp = fixture.componentInstance;

    cmp.setMode('semantic');
    cmp.query.set('g');
    fixture.detectChanges();
    cmp.query.set('gr');
    fixture.detectChanges();
    cmp.query.set('graph');
    fixture.detectChanges();

    // Inside the 250 ms window, no /api/search request should be queued.
    httpMock.expectNone((r) => r.url === '/api/search');

    // Wait past the debounce period.
    await new Promise((r) => setTimeout(r, 320));
    fixture.detectChanges();

    const reqs = httpMock.match((r) => r.url === '/api/search');
    expect(reqs.length).toBe(1);
    expect(reqs[0].request.params.get('q')).toBe('graph');
    reqs[0].flush([]);
  });
});
