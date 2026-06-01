import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { GruppiService } from '../../core/services/gruppi.service';
import { AreaGruppo, AREA_LABELS } from '../../core/models/gruppo.model';

@Component({
  selector: 'app-gruppo-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page-content">
      @if (gruppo(); as g) {
        <article class="pagina">
          <header class="pagina-header">
            <a [routerLink]="['/gruppi', g.area]" class="back">&larr; {{ areaLabel(g.area) }}</a>
            <h1>{{ g.nome }}</h1>
            @if (g.referente) { <p class="sottotitolo">Referente: {{ g.referente }}</p> }
          </header>
          @if (g.immagine) {
            <img [src]="g.immagine" [alt]="g.nome" class="pagina-img">
          }
          @if (g.contenuto) {
            <div class="prosa" [innerHTML]="g.contenuto"></div>
          } @else if (g.descrizione) {
            <p class="prosa">{{ g.descrizione }}</p>
          } @else {
            <p class="empty"><em>Contenuto in aggiornamento.</em></p>
          }
        </article>
      } @else if (loaded()) {
        <div class="notfound">
          <h1>Gruppo non trovato</h1>
          <p class="empty">Il contenuto richiesto non è disponibile.</p>
          <a routerLink="/gruppi" class="btn btn-outline">Torna ai Gruppi</a>
        </div>
      } @else {
        <p class="empty">Caricamento…</p>
      }
    </div>
  `,
  styles: [`
    .pagina { max-width: 760px; margin: 0 auto; }
    .pagina-header {
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 1rem;
      margin-bottom: 1.75rem;
    }
    .back {
      display: inline-block;
      margin-bottom: .5rem;
      font-size: .9rem;
      color: var(--color-text-muted);
    }
    .pagina-header h1 { font-size: 2.1rem; margin-bottom: .25rem; }
    .sottotitolo { color: var(--color-text-muted); font-style: italic; margin: 0; }
    .pagina-img {
      display: block;
      float: left;
      max-width: 300px;
      width: 45%;
      height: auto;
      margin: .25rem 1.75rem 1rem 0;
      border-radius: var(--radius);
      border: 4px solid white;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    .prosa { font-size: 1.02rem; }
    .prosa::after { content: ''; display: block; clear: both; }
    .prosa ::ng-deep h3 { margin-top: 1.75rem; font-size: 1.2rem; color: var(--color-primary); }
    .prosa ::ng-deep p { margin: 0 0 1rem; }
    .prosa ::ng-deep ul { padding-left: 1.25rem; margin: 0 0 1rem; }
    .prosa ::ng-deep li { margin-bottom: .35rem; }
    .notfound { text-align: center; padding: 3rem 0; }
    .notfound a { margin-top: 1rem; }
  `],
})
export class GruppoDetailComponent {
  private route = inject(ActivatedRoute);
  private service = inject(GruppiService);

  private readonly gruppi = toSignal(this.service.getAll(), { initialValue: null });

  private readonly params = toSignal(
    this.route.paramMap.pipe(
      map(p => ({ area: p.get('area') as AreaGruppo | null, slug: p.get('slug') ?? '' })),
    ),
    { initialValue: { area: null as AreaGruppo | null, slug: '' } },
  );

  readonly loaded = computed(() => this.gruppi() !== null);

  readonly gruppo = computed(() => {
    const list = this.gruppi();
    const { area, slug } = this.params();
    if (!list) return null;
    return list.find(g => g.area === area && g.slug === slug) ?? null;
  });

  areaLabel(area: AreaGruppo): string {
    return AREA_LABELS[area];
  }
}
