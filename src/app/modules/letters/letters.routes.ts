import { Routes } from '@angular/router';

export const letterRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./letters-list.component').then(m => m.LettersListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./letter-form.component').then(m => m.LetterFormComponent)
  },
  {
    path: 'inbox',
    loadComponent: () => import('./letters-inbox.component').then(m => m.LettersInboxComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./letter-detail.component').then(m => m.LetterDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./letter-form.component').then(m => m.LetterFormComponent)
  }
];
