import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'notizie',
    loadComponent: () => import('./pages/news/news-list/news-list.component').then(m => m.NewsListComponent),
  },
  {
    path: 'notizie/:id',
    loadComponent: () => import('./pages/news/news-detail/news-detail.component').then(m => m.NewsDetailComponent),
  },
  {
    path: 'eventi',
    loadComponent: () => import('./pages/eventi/eventi.component').then(m => m.EventiComponent),
  },
  {
    path: 'orari-messe',
    loadComponent: () => import('./pages/orari-messe/orari-messe.component').then(m => m.OrariMesseComponent),
  },
  {
    path: 'parrocchia',
    loadComponent: () => import('./pages/parrocchia/parrocchia.component').then(m => m.ParrocchiaComponent),
  },
  {
    path: 'gruppi',
    loadComponent: () => import('./pages/gruppi/gruppi.component').then(m => m.GruppiComponent),
  },
  {
    path: 'intenzioni-preghiera',
    loadComponent: () => import('./pages/intenzioni/intenzioni-preghiera.component').then(m => m.IntenzioniPreghieraComponent),
  },
  {
    path: 'p/:slug',
    loadComponent: () => import('./pages/pagina/pagina.component').then(m => m.PaginaComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/login/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
