import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { BRAIN_Q_DATA } from './brain-q-data.service';
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
  return makeEnvironmentProviders([
    { provide: BRAIN_Q_DATA, useClass: InMemoryBrainQDataService },
  ]);
}
