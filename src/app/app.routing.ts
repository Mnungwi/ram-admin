import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { BlankComponent } from './pages/blank/blank.component';
import { SearchComponent } from './pages/search/search.component';
import { NotFoundComponent } from './pages/errors/not-found/not-found.component';
import { authGuard, guestGuard, mustChangePasswordGuard, permissionGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    canActivate: [authGuard, mustChangePasswordGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./modules/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'clients',
        canActivate: [permissionGuard('client:view')],
        loadComponent: () =>
          import('./modules/clients/clients.component').then(
            (m) => m.ClientsComponent,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./modules/projects/project-list/project-list.component').then(
            (m) => m.ProjectListComponent,
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import(
            './modules/projects/project-detail/project-detail.component'
          ).then((m) => m.ProjectDetailComponent),
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          {
            path: 'overview',
            loadComponent: () =>
              import(
                './modules/projects/tabs/overview/overview.component'
              ).then((m) => m.OverviewComponent),
          },
          {
            path: 'activities',
            canActivate: [permissionGuard('activity:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/activities/activities.component'
              ).then((m) => m.ActivitiesComponent),
          },
          {
            path: 'procurement',
            canActivate: [permissionGuard('procurement:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/procurement/procurement.component'
              ).then((m) => m.ProcurementComponent),
          },
          {
            path: 'finance',
            canActivate: [permissionGuard('finance:view')],
            loadComponent: () =>
              import('./modules/projects/tabs/finance/finance.component').then(
                (m) => m.FinanceComponent,
              ),
          },
          {
            path: 'reports',
            canActivate: [permissionGuard('report:view')],
            loadComponent: () =>
              import('./modules/projects/tabs/reports/reports.component').then(
                (m) => m.ReportsComponent,
              ),
          },
          {
            path: 'documents',
            canActivate: [permissionGuard('document:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/documents/documents.component'
              ).then((m) => m.DocumentsComponent),
          },
          {
            path: 'letters',
            canActivate: [permissionGuard('letter:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/letters/letters.component'
              ).then((m) => m.LettersComponent),
          },
          {
            path: 'gallery',
            loadComponent: () =>
              import(
                './modules/projects/tabs/gallery/gallery.component'
              ).then((m) => m.GalleryComponent),
          },
          {
            path: 'team',
            canActivate: [permissionGuard('team:view')],
            loadComponent: () =>
              import('./modules/projects/tabs/team/team.component').then(
                (m) => m.TeamComponent,
              ),
          },
          {
            path: 'project-technicians',
            canActivate: [permissionGuard('technician:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/project-technicians/project-technicians.component'
              ).then((m) => m.ProjectTechniciansComponent),
          },
          {
            path: 'project-storekeepers',
            canActivate: [permissionGuard('project:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/project-storekeepers/project-storekeepers.component'
              ).then((m) => m.ProjectStorekeepersComponent),
          },
          {
            path: 'subcontractors',
            canActivate: [permissionGuard('subcontractor:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/subcontractors/subcontractors.component'
              ).then((m) => m.SubcontractorsComponent),
          },

          {
            path: 'settings',
            canActivate: [permissionGuard('project:update')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/settings/settings.component'
              ).then((m) => m.SettingsComponent),
          },
          {
            path: 'requisitions',
            canActivate: [permissionGuard('requisition:view')],
            loadComponent: () =>
              import(
                './modules/projects/tabs/requisitions/requisitions.component'
              ).then((m) => m.RequisitionsComponent),
          },
          {
            path: 'lpo',
            canActivate: [permissionGuard('lpo:view')],
            loadComponent: () =>
              import('./modules/projects/tabs/lpo/lpo.component').then(
                (m) => m.LpoComponent,
              ),
          },
        ],
      },
      {
        path: 'letters',
        canActivate: [permissionGuard('letter:view')],
        loadChildren: () =>
          import('./modules/letters/letters.routes').then(
            (m) => m.letterRoutes,
          ),
      },
      {
        path: 'users',
        canActivate: [permissionGuard('user:view')],
        loadComponent: () =>
          import('./modules/users/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
      {
        path: 'storekeepers',
        canActivate: [permissionGuard('project:view')],
        loadComponent: () =>
          import('./modules/storekeepers/storekeepers.component').then(
            (m) => m.StorekeepersComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./modules/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
      },
      {
        path: 'phase',
        canActivate: [permissionGuard('project:view')],
        loadComponent: () =>
          import('./modules/phase/phases.component').then(
            (m) => m.PhasesComponent,
          ),
      },
      {
        path: 'activity-types',
        canActivate: [permissionGuard('activity_type:view')],
        loadComponent: () =>
          import('./modules/activity-types/activity-types.component').then(
            (m) => m.ActivityTypesComponent,
          ),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard('role:view')],
        loadComponent: () =>
          import('./modules/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
      },
      {
        path: 'suppliers',
        canActivate: [permissionGuard('supplier:view')],
        loadComponent: () =>
          import('./modules/suppliers/suppliers.component').then(
            (m) => m.SuppliersComponent,
          ),
      },
      {
        path: 'products',
        canActivate: [permissionGuard('product:view')],
        loadComponent: () =>
          import('./modules/products/products.component').then(
            (m) => m.ProductsComponent,
          ),
      },
      {
        path: 'technicians',
        canActivate: [permissionGuard('technician:view')],
        loadComponent: () =>
          import('./modules/technicians/technicians.component').then(
            (m) => m.TechniciansComponent,
          ),
      },
      {
        path: 'expense-categories',
        loadComponent: () =>
          import(
            './modules/expense-categories/expense-categories.component'
          ).then((m) => m.ExpenseCategoriesComponent),
      },
      {
        path: 'website-projects',
        canActivate: [permissionGuard('website:view')],
        loadComponent: () =>
          import('./modules/website-projects/website-projects.component').then(
            (m) => m.WebsiteProjectsComponent,
          ),
      },
      {
        path: 'website-gallery',
        canActivate: [permissionGuard('website:view')],
        loadComponent: () =>
          import('./modules/website-gallery/website-gallery.component').then(
            (m) => m.WebsiteGalleryComponent,
          ),
      },
      {
        path: 'website-seo',
        canActivate: [permissionGuard('website:view')],
        loadComponent: () =>
          import('./modules/website-seo/website-seo.component').then(
            (m) => m.WebsiteSeoComponent,
          ),
      },
      {
        path: 'website-content',
        canActivate: [permissionGuard('website:view')],
        loadComponent: () =>
          import('./modules/website-content/website-content.component').then(
            (m) => m.WebsiteContentComponent,
          ),
      },
      {
        path: 'contact-inbox',
        canActivate: [permissionGuard('inquiry:view')],
        loadComponent: () =>
          import('./modules/contact-inbox/contact-inbox.component').then(
            (m) => m.ContactInboxComponent,
          ),
      },
      {
        path: 'audit-logs',
        canActivate: [permissionGuard('audit:view')],
        loadComponent: () =>
          import('./modules/audit-logs/audit-logs.component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
      {
        path: 'appearance',
        canActivate: [permissionGuard('settings:update')],
        loadComponent: () =>
          import('./modules/appearance/appearance.component').then(
            (m) => m.AppearanceComponent,
          ),
      },
      {
        path: 'blank',
        component: BlankComponent,
        data: { breadcrumb: 'Blank page' },
      },
      {
        path: 'search',
        component: SearchComponent,
        data: { breadcrumb: 'Search' },
      },
    ],
  },
  // Auth routes stay OUTSIDE PagesComponent (no sidebar/header on login screen)
  {
    path: 'login',
    loadChildren: () =>
      import('./pages/login/login.module').then((m) => m.LoginModule),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./modules/auth-pages/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./modules/auth-pages/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'force-change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/auth-pages/force-change-password.component').then(
        (m) => m.ForceChangePasswordComponent,
      ),
  },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
