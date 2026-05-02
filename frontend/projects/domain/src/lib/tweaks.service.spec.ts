import { TestBed } from '@angular/core/testing';
import { BQ_TWEAKS, provideBqTweaks } from './tweaks.service';

describe('LocalStorageBqTweaks', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
    delete document.documentElement.dataset['density'];
    document.documentElement.style.removeProperty('--bq-accent');
  });

  it('defaults to light/terracotta/cozy when localStorage is empty', () => {
    TestBed.configureTestingModule({ providers: [provideBqTweaks()] });
    const tweaks = TestBed.inject(BQ_TWEAKS);
    TestBed.flushEffects();

    expect(tweaks.theme()).toBe('light');
    expect(tweaks.accent()).toBe('terracotta');
    expect(tweaks.density()).toBe('cozy');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(document.documentElement.dataset['density']).toBe('cozy');
    expect(document.documentElement.style.getPropertyValue('--bq-accent')).not.toBe('');
  });

  it('reads persisted values from localStorage', () => {
    localStorage.setItem('bq.theme', 'dark');
    localStorage.setItem('bq.accent', 'moss');
    localStorage.setItem('bq.density', 'compact');

    TestBed.configureTestingModule({ providers: [provideBqTweaks()] });
    const tweaks = TestBed.inject(BQ_TWEAKS);
    TestBed.flushEffects();

    expect(tweaks.theme()).toBe('dark');
    expect(tweaks.accent()).toBe('moss');
    expect(tweaks.density()).toBe('compact');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('setTheme persists and re-applies', () => {
    TestBed.configureTestingModule({ providers: [provideBqTweaks()] });
    const tweaks = TestBed.inject(BQ_TWEAKS);
    TestBed.flushEffects();

    tweaks.setTheme('dark');
    TestBed.flushEffects();

    expect(localStorage.getItem('bq.theme')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('setAccent updates the --bq-accent custom property', () => {
    TestBed.configureTestingModule({ providers: [provideBqTweaks()] });
    const tweaks = TestBed.inject(BQ_TWEAKS);
    TestBed.flushEffects();

    const before = document.documentElement.style.getPropertyValue('--bq-accent');
    tweaks.setAccent('moss');
    TestBed.flushEffects();

    const after = document.documentElement.style.getPropertyValue('--bq-accent');
    expect(after).not.toBe(before);
  });
});
