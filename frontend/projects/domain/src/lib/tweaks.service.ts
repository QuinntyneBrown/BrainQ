import {
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  Signal,
  effect,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

export type BqTheme = 'light' | 'sepia' | 'dark';
export type BqAccent = 'terracotta' | 'ink' | 'moss' | 'ochre' | 'rose';
export type BqDensity = 'cozy' | 'compact';

export interface BqTweaks {
  readonly theme: Signal<BqTheme>;
  readonly accent: Signal<BqAccent>;
  readonly density: Signal<BqDensity>;
  setTheme(t: BqTheme): void;
  setAccent(a: BqAccent): void;
  setDensity(d: BqDensity): void;
}

export const BQ_TWEAKS = new InjectionToken<BqTweaks>('BQ_TWEAKS');

const ACCENTS: Record<BqAccent, { base: string; soft: string; ink: string }> = {
  terracotta: { base: '#c2542d', soft: 'rgba(194, 84, 45, 0.12)', ink: '#1a1411' },
  ink:        { base: '#1f2937', soft: 'rgba(31, 41, 55, 0.12)',  ink: '#f4f4f5' },
  moss:       { base: '#4a6b3d', soft: 'rgba(74, 107, 61, 0.12)', ink: '#0d1409' },
  ochre:      { base: '#a87a1f', soft: 'rgba(168, 122, 31, 0.12)', ink: '#1a1407' },
  rose:       { base: '#b54a6b', soft: 'rgba(181, 74, 107, 0.12)', ink: '#1a0d11' },
};

const THEMES: BqTheme[] = ['light', 'sepia', 'dark'];
const ACCENT_KEYS: BqAccent[] = ['terracotta', 'ink', 'moss', 'ochre', 'rose'];
const DENSITIES: BqDensity[] = ['cozy', 'compact'];

function read<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof localStorage === 'undefined') return fallback;
  const raw = localStorage.getItem(key);
  return (allowed as readonly string[]).includes(raw ?? '') ? (raw as T) : fallback;
}

function apply(theme: BqTheme, accent: BqAccent, density: BqDensity): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset['theme'] = theme;
  root.dataset['density'] = density;
  const a = ACCENTS[accent];
  root.style.setProperty('--bq-accent', a.base);
  root.style.setProperty('--bq-accent-soft', a.soft);
  root.style.setProperty('--bq-accent-ink', a.ink);
}

@Injectable()
export class LocalStorageBqTweaks implements BqTweaks {
  private readonly _theme = signal<BqTheme>(read('bq.theme', 'light', THEMES));
  private readonly _accent = signal<BqAccent>(read('bq.accent', 'terracotta', ACCENT_KEYS));
  private readonly _density = signal<BqDensity>(read('bq.density', 'cozy', DENSITIES));

  readonly theme = this._theme.asReadonly();
  readonly accent = this._accent.asReadonly();
  readonly density = this._density.asReadonly();

  constructor() {
    effect(() => apply(this._theme(), this._accent(), this._density()));
  }

  setTheme(t: BqTheme): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem('bq.theme', t);
    this._theme.set(t);
  }
  setAccent(a: BqAccent): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem('bq.accent', a);
    this._accent.set(a);
  }
  setDensity(d: BqDensity): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem('bq.density', d);
    this._density.set(d);
  }
}

export function provideBqTweaks(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: BQ_TWEAKS, useClass: LocalStorageBqTweaks }]);
}
