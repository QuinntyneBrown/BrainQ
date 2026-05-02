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
});
