import { Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { EventiService } from '../../../core/services/eventi.service';
import { assetUrl } from '../../../core/utils/asset-url';
import { etichettaStato, giorniEvento, statoEvento } from '../../../core/utils/durata-evento';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page-content">
      <a routerLink="/eventi" class="back">&larr; Tutti gli eventi</a>

      @if (evento()) {
        <article class="article">
          @if (evento()!.immagine) {
            <img [src]="src(evento()!.immagine!)" [alt]="evento()!.titolo" class="article-img">
          }
          @if (evento()!.inEvidenza || etichetta() || giorni() > 1) {
            <div class="badges">
              @if (evento()!.inEvidenza && stato() !== 'passato') { <span class="badge star">★ In evidenza</span> }
              @if (etichetta()) { <span class="badge stato" [class.live]="stato() === 'in-corso'">{{ etichetta() }}</span> }
              @if (giorni() > 1) { <span class="badge">{{ giorni() }} giorni</span> }
            </div>
          }
          <h1>{{ evento()!.titolo }}</h1>

          @if (giorni() > 1) {
            <div class="periodo">
              <div><span class="lbl">Dal</span> <span class="when">{{ evento()!.dataInizio | date:'EEEE d MMMM yyyy, HH:mm':'':'it' }}</span></div>
              <div><span class="lbl">al</span> <span class="when">{{ evento()!.dataFine | date:'EEEE d MMMM yyyy, HH:mm':'':'it' }}</span></div>
            </div>
          }

          <div class="event-meta">
            @if (giorni() === 1) {
              <span class="meta-item">
                <span class="ico">🕒</span>
                <span class="when">{{ evento()!.dataInizio | date:'EEEE d MMMM yyyy, HH:mm':'':'it' }}</span>
                @if (evento()!.dataFine) {
                  <span class="range"> → {{ evento()!.dataFine | date:'HH:mm':'':'it' }}</span>
                }
              </span>
            }
            @if (evento()!.luogo) {
              <span class="meta-item"><span class="ico">📍</span>{{ evento()!.luogo }}</span>
            }
          </div>

          @if (evento()!.descrizione) {
            <div class="article-body" [innerHTML]="evento()!.descrizione"></div>
          }
        </article>
      } @else {
        <p class="empty">Evento non trovato.</p>
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 1.5rem; color: var(--color-text-muted); font-size: .9rem; }
    .article-img { width: 100%; aspect-ratio: 8 / 5; object-fit: cover; border-radius: var(--radius); margin-bottom: 1.5rem; }
    .article h1 { margin-bottom: .75rem; }
    .event-meta { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; margin-bottom: 1.25rem; }
    .meta-item { display: inline-flex; align-items: center; gap: .4rem; color: var(--color-text-muted); }
    .meta-item .when:first-letter { text-transform: capitalize; }
    .range { color: var(--color-text-muted); }
    .badges { display: flex; flex-wrap: wrap; gap: .4rem; margin-bottom: .6rem; }
    .badge { font-size: .78rem; font-weight: 700; padding: .2rem .6rem; border-radius: 999px; white-space: nowrap; text-transform: none; margin-top: 0;
             background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); }
    .badge.stato { background: color-mix(in srgb, var(--color-primary) 10%, white); color: var(--color-primary-dark);
                   border-color: color-mix(in srgb, var(--color-primary) 30%, white); }
    .badge.stato.live { background: #e7f6ec; color: #166534; border-color: #86efac; }
    .badge.star { background: color-mix(in srgb, var(--color-secondary) 16%, white); color: #7a5f0c;
                  border-color: color-mix(in srgb, var(--color-secondary) 55%, white); }
    .periodo { display: inline-grid; gap: .2rem; padding: .7rem 1rem; margin-bottom: 1rem; font-size: 1.05rem;
               background: color-mix(in srgb, var(--color-primary) 6%, white); border-left: 4px solid var(--color-primary);
               border-radius: var(--radius); }
    .periodo .lbl { display: inline-block; min-width: 2em; color: var(--color-text-muted); }
    .periodo .when { display: inline-block; font-weight: 600; }
    .periodo .when:first-letter { text-transform: capitalize; }
    .article-body { line-height: 1.8; margin-top: 1rem; }
    .article-body img { display: block; width: 100%; height: auto; margin: 1.25rem auto; border-radius: var(--radius); }
    .article-body h3 { margin: 1.25rem 0 .5rem; font-size: 1.05rem; }
    .article-body ul { padding-left: 1.25rem; margin: .25rem 0 .75rem; }
    .article-body li { margin-bottom: .25rem; }
  `],
})
export class EventDetailComponent {
  private eventiService = inject(EventiService);
  private route = inject(ActivatedRoute);

  src = assetUrl;

  readonly evento = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.eventiService.getOne(params.get('id')!)),
    ),
  );

  readonly giorni = computed(() => { const e = this.evento(); return e ? giorniEvento(e) : 1; });
  readonly stato = computed(() => { const e = this.evento(); return e ? statoEvento(e) : 'passato'; });
  readonly etichetta = computed(() => { const e = this.evento(); return e ? etichettaStato(e) : null; });
}
