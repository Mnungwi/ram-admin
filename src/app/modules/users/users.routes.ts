// users.routes.ts
import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list.component').then(m => m.UsersListComponent)
  }
];
