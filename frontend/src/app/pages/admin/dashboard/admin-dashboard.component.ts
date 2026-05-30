import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Section {
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page-content">
      <div class="dashboard-header">
        <h1>Pannello di Amministrazione</h1>
        <p class="muted">Gestisci i contenuti del sito.</p>
      </div>

      <div class="sections-grid">
        @for (s of sections; track s.route) {
          <div class="section-card">
            <div class="section-icon">{{ s.icon }}</div>
            <h3>{{ s.label }}</h3>
            <p>{{ s.description }}</p>
          </div>
        }
      </div>

      <div class="quick-links">
        <h2>Azioni rapide</h2>
        <div class="actions">
          <a routerLink="/notizie" class="btn btn-outline">Vedi Notizie</a>
          <a routerLink="/eventi" class="btn btn-outline">Vedi Eventi</a>
          <a routerLink="/orari-messe" class="btn btn-outline">Vedi Orari Messe</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 2rem; }
    .muted { color: var(--color-text-muted); margin: 0; }
    .sections-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .section-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 1.5rem;
      h3 { margin-bottom: .35rem; font-size: 1rem; }
      p { margin: 0; font-size: .85rem; color: var(--color-text-muted); }
    }
    .section-icon { font-size: 1.75rem; margin-bottom: .5rem; }
    .quick-links h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    .actions { display: flex; gap: .75rem; flex-wrap: wrap; }
  `],
})
export class AdminDashboardComponent {
  protected auth = inject(AuthService);

  readonly sections: Section[] = [
    { label: 'Notizie', description: 'Pubblica e gestisci le notizie parrocchiali.', icon: 'N', route: '/admin/news' },
    { label: 'Eventi', description: 'Crea e aggiorna gli eventi in calendario.', icon: 'E', route: '/admin/eventi' },
    { label: 'Orari Messe', description: 'Modifica gli orari delle celebrazioni.', icon: 'M', route: '/admin/orari-messe' },
    { label: 'Media', description: 'Carica immagini e documenti PDF.', icon: 'F', route: '/admin/media' },
  ];
}
