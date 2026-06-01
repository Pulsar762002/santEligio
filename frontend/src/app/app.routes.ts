import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

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
    path: 'parrocchia/:sezione',
    loadComponent: () => import('./pages/parrocchia/parrocchia.component').then(m => m.ParrocchiaComponent),
  },
  {
    path: 'gruppi',
    loadComponent: () => import('./pages/gruppi/gruppi.component').then(m => m.GruppiComponent),
  },
  {
    path: 'gruppi/:area',
    loadComponent: () => import('./pages/gruppi/gruppi.component').then(m => m.GruppiComponent),
  },
  {
    path: 'galleria',
    loadComponent: () => import('./pages/galleria/galleria.component').then(m => m.GalleriaComponent),
  },
  {
    path: 'intenzioni-preghiera',
    loadComponent: () => import('./pages/intenzioni/intenzioni-preghiera.component').then(m => m.IntenzioniPreghieraComponent),
  },
  {
    path: 'p/stradario',
    loadComponent: () => import('./pages/stradario/stradario.component').then(m => m.StradarioComponent),
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
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'admin/eventi',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/eventi/admin-eventi.component').then(m => m.AdminEventiComponent),
  },
  {
    path: 'admin/news',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/news/admin-news.component').then(m => m.AdminNewsComponent),
  },
  {
    path: 'admin/orari-messe',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/orari-messe/admin-orari-messe.component').then(m => m.AdminOrariMesseComponent),
  },
  {
    path: 'admin/media',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/media/admin-media.component').then(m => m.AdminMediaComponent),
  },
  {
    path: 'admin/stradario',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/stradario/admin-stradario.component').then(m => m.AdminStradarioComponent),
  },
  {
    path: 'admin/pagine',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/pagine/admin-pagine.component').then(m => m.AdminPagineComponent),
  },
  {
    path: 'admin/galleria',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/galleria/admin-galleria.component').then(m => m.AdminGalleriaComponent),
  },
  { path: '**', redirectTo: '' },
];
