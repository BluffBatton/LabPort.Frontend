import { Routes } from '@angular/router';

import { adminChildGuard, adminGuard, authChildGuard, authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'lab'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage)
  },
  {
    path: 'login',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register-page/register-page').then((m) => m.RegisterPage)
  },
  {
    path: 'register',
    redirectTo: 'auth/register'
  },
  {
    path: 'lab',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () => import('./layouts/lab-layout/lab-layout').then((m) => m.LabLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/lab/dashboard/lab-dashboard-page').then((m) => m.LabDashboardPage)
      },
      {
        path: 'container',
        loadComponent: () => import('./features/lab/container/container-page').then((m) => m.ContainerPage)
      },
      {
        path: 'readings',
        loadComponent: () => import('./features/lab/readings/readings-page').then((m) => m.ReadingsPage)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/lab/alerts/alerts-page').then((m) => m.AlertsPage)
      },
      {
        path: 'samples',
        loadComponent: () => import('./features/lab/samples/samples-page').then((m) => m.SamplesPage)
      },
      {
        path: 'sources',
        loadComponent: () => import('./features/lab/sources/sources-page').then((m) => m.SourcesPage)
      },
      {
        path: 'tests',
        loadComponent: () => import('./features/lab/tests/tests-page').then((m) => m.TestsPage)
      },
      {
        path: 'orders',
        loadComponent: () => import('./shared/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
        data: {
          eyebrowKey: 'common.lab',
          titleKey: 'pages.orders.title',
          descriptionKey: 'pages.orders.description',
          endpointArea: 'lab',
          endpointName: 'orders'
        }
      },
      {
        path: 'results',
        loadComponent: () => import('./features/lab/results/results-page').then((m) => m.ResultsPage)
      },
      {
        path: 'reports',
        loadComponent: () => import('./shared/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
        data: {
          eyebrowKey: 'common.lab',
          titleKey: 'pages.reports.title',
          descriptionKey: 'pages.reports.description',
          endpointArea: 'lab',
          endpointName: 'reports'
        }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/account/profile-page/profile-page').then((m) => m.ProfilePage)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    canActivateChild: [authChildGuard, adminChildGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard-page').then((m) => m.AdminDashboardPage)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/admin-users-page').then((m) => m.AdminUsersPage)
      },
      {
        path: 'roles',
        loadComponent: () => import('./shared/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
        data: {
          eyebrowKey: 'common.admin',
          titleKey: 'pages.roles.title',
          descriptionKey: 'pages.roles.description',
          endpointArea: 'admin',
          endpointName: 'roles'
        }
      },
      {
        path: 'source-types',
        loadComponent: () => import('./features/admin/dictionaries/admin-dictionaries-page').then((m) => m.AdminDictionariesPage),
        data: {
          dictionaryKind: 'source'
        }
      },
      {
        path: 'test-types',
        loadComponent: () => import('./features/admin/dictionaries/admin-dictionaries-page').then((m) => m.AdminDictionariesPage),
        data: {
          dictionaryKind: 'test'
        }
      },
      {
        path: 'dictionaries',
        pathMatch: 'full',
        redirectTo: 'source-types'
      },
      {
        path: 'data-management',
        loadComponent: () => import('./features/admin/data-management/admin-data-management-page').then((m) => m.AdminDataManagementPage)
      },
      {
        path: 'audit',
        loadComponent: () => import('./shared/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
        data: {
          eyebrowKey: 'common.admin',
          titleKey: 'pages.audit.title',
          descriptionKey: 'pages.audit.description',
          endpointArea: 'admin',
          endpointName: 'audit'
        }
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/account/profile-page/profile-page').then((m) => m.ProfilePage)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/placeholder-page/placeholder-page').then((m) => m.PlaceholderPage),
    data: {
      eyebrowKey: 'common.appName',
      titleKey: 'pages.notFound.title',
      descriptionKey: 'pages.notFound.description'
    }
  }
];
