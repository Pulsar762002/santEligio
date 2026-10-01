import { Routes } from '@angular/router';
import { adminGuard, grestAdminGuard, loggatoGuard, staffGuard } from './core/guards/admin.guard';
import { grestGuard } from './core/guards/grest.guard';

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
    path: 'eventi/:id',
    loadComponent: () => import('./pages/eventi/event-detail/event-detail.component').then(m => m.EventDetailComponent),
  },
  {
    path: 'orari-messe',
    loadComponent: () => import('./pages/orari-messe/orari-messe.component').then(m => m.OrariMesseComponent),
  },
  {
    path: 'gruppi',
    loadComponent: () => import('./pages/gruppi/gruppi.component').then(m => m.GruppiComponent),
  },
  {
    path: 'gruppi/:area/:slug',
    loadComponent: () => import('./pages/gruppi/gruppo-detail.component').then(m => m.GruppoDetailComponent),
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
    canActivate: [staffGuard],
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'admin/eventi',
    canActivate: [staffGuard],
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
    canActivate: [staffGuard],
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
  {
    path: 'admin/calendario',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/calendario/admin-calendario.component').then(m => m.AdminCalendarioComponent),
  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.component').then(m => m.CalendarioComponent),
  },
  {
    path: 'grest/accedi',
    loadComponent: () => import('./pages/grest/grest-accedi.component').then(m => m.GrestAccediComponent),
  },
  {
    path: 'grest/registrazione',
    loadComponent: () => import('./pages/grest/grest-registrazione.component').then(m => m.GrestRegistrazioneComponent),
  },
  {
    path: 'grest/attivazione',
    loadComponent: () => import('./pages/grest/grest-attivazione.component').then(m => m.GrestAttivazioneComponent),
  },
  {
    path: 'grest/area',
    canActivate: [grestGuard],
    loadComponent: () => import('./pages/grest/grest-area.component').then(m => m.GrestAreaComponent),
  },
  { path: 'grest', redirectTo: 'grest/accedi', pathMatch: 'full' },
  {
    path: 'admin/grest',
    canActivate: [grestAdminGuard],
    loadComponent: () => import('./pages/admin/grest/admin-grest.component').then(m => m.AdminGrestComponent),
  },
  {
    path: 'admin/utenti',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/utenti/admin-utenti.component').then(m => m.AdminUtentiComponent),
  },
  {
    path: 'admin/aree',
    canActivate: [staffGuard],
    loadComponent: () => import('./pages/admin/aree/admin-aree.component').then(m => m.AdminAreeComponent),
  },
  {
    path: 'admin/aree/:area',
    canActivate: [staffGuard],
    loadComponent: () => import('./pages/admin/aree/admin-area.component').then(m => m.AdminAreaComponent),
  },
  {
    path: 'admin/approvazioni',
    canActivate: [staffGuard],
    loadComponent: () => import('./pages/admin/approvazioni/admin-approvazioni.component').then(m => m.AdminApprovazioniComponent),
  },
  {
    path: 'profilo',
    canActivate: [loggatoGuard],
    loadComponent: () => import('./pages/profilo/profilo.component').then(m => m.ProfiloComponent),
  },
  { path: '**', redirectTo: '' },
];
