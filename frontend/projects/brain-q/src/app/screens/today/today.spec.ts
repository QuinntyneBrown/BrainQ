import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BRAIN_Q_DATA, BqAgenda, provideBrainQHttpDomain } from 'domain';
import { TodayScreen } from './today';

const fakeAgenda: BqAgenda = {
  date: 'Friday, May 1',
  greeting: 'Quiet morning',
  prompt: 'What’s on your mind?',
  recent: [],
  nudges: [],
};

describe('TodayScreen — slice 05 hydration + testids', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodayScreen],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQHttpDomain({ baseUrl: '/api' }),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(BRAIN_Q_DATA);
    httpMock.expectOne('/api/entities').flush([]);
    httpMock.expectOne('/api/today').flush(fakeAgenda);
  });

  afterEach(() => httpMock.verify());

  it('hydrates agenda from /api/today and renders the greeting', () => {
    const fixture = TestBed.createComponent(TodayScreen);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-testid="today-greeting"]')?.textContent).toContain('Quiet morning');
    expect(host.querySelector('[data-testid="today-capture-prompt"]')).toBeTruthy();
  });
});
