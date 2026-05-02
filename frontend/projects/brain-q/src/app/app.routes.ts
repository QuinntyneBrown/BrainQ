import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'today',
    loadComponent: () => import('./screens/today/today').then((m) => m.TodayScreen),
  },
  {
    path: 'brain',
    loadComponent: () => import('./screens/brain/brain').then((m) => m.BrainScreen),
  },
  {
    path: 'search',
    loadComponent: () => import('./screens/search/search').then((m) => m.SearchScreen),
  },
  { path: '', pathMatch: 'full', redirectTo: 'today' },
  { path: '**', redirectTo: 'today' },
];
