import { HttpClient } from '@angular/common/http';
import {
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  Signal,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

export interface BqHealth {
  readonly down: Signal<boolean>;
  check(): void;
}

export const BQ_HEALTH = new InjectionToken<BqHealth>('BQ_HEALTH');

@Injectable()
export class HttpHealth implements BqHealth {
  private readonly http = inject(HttpClient);
  private readonly _down = signal(false);

  readonly down = this._down.asReadonly();

  check(): void {
    this.http.get('/health').subscribe({
      next: () => this._down.set(false),
      error: () => this._down.set(true),
    });
  }
}

export function provideBqHealth(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: BQ_HEALTH, useClass: HttpHealth }]);
}
