import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { API_BASE_URL } from './api-base-url.token';
import { BRAIN_Q_DATA } from './brain-q-data.service';
import { HttpBrainQDataService } from './http-data.service';
import { InMemoryBrainQDataService } from './in-memory-data.service';

/**
 * Wires the BrainQ data layer with the in-memory implementation.
 *
 * Drop into `app.config.ts`:
 * ```ts
 * providers: [provideBrainQDomain()]
 * ```
 *
 * Swapping in a real HTTP-backed implementation later means changing this
 * provider list, not the application code.
 */
export function provideBrainQDomain(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: BRAIN_Q_DATA, useClass: InMemoryBrainQDataService }]);
}

export interface BrainQHttpDomainOptions {
  readonly baseUrl: string;
}

export function provideBrainQHttpDomain(options: BrainQHttpDomainOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: API_BASE_URL, useValue: normalizeBaseUrl(options.baseUrl) },
    { provide: BRAIN_Q_DATA, useClass: HttpBrainQDataService },
  ]);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}
