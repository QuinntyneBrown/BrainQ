import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideBqHealth, provideBqTweaks, provideBrainQHttpDomain } from 'domain';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes),
    provideBrainQHttpDomain({ baseUrl: '/api' }),
    provideBqTweaks(),
    provideBqHealth(),
  ],
};
