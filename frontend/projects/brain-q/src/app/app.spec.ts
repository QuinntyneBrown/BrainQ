import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideBqHealth, provideBqTweaks, provideBrainQDomain } from 'domain';
import { AppShellState } from './app-shell-state';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideBrainQDomain(),
        provideBqTweaks(),
        provideBqHealth(),
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  function flushHealth() {
    const req = httpMock.match((r) => r.url.endsWith('/health'));
    req.forEach((r) => r.flush({ status: 'ok', db: 'ok' }));
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    flushHealth();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the routed today screen', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    await router.navigateByUrl('/today');
    fixture.detectChanges();
    flushHealth();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Quiet morning');
  });

  it('opens the capture sheet when N is pressed (bug 0006)', () => {
    const shell = TestBed.inject(AppShellState);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    flushHealth();

    expect(shell.captureOpen()).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));
    expect(shell.captureOpen()).toBe(true);
  });

  it('does NOT trigger the N shortcut while typing in an input', () => {
    const shell = TestBed.inject(AppShellState);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    flushHealth();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    try {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
      expect(shell.captureOpen()).toBe(false);
    } finally {
      document.body.removeChild(input);
    }
  });
});
