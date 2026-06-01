import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { EventiService } from '../../../core/services/eventi.service';
import { assetUrl } from '../../../core/utils/asset-url';

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
          <h1>{{ evento()!.titolo }}</h1>

          <div class="event-meta">
            <span class="meta-item">
              <span class="ico">🕒</span>
              <span class="when">{{ evento()!.dataInizio | date:'EEEE d MMMM yyyy, HH:mm':'':'it' }}</span>
              @if (evento()!.dataFine) {
                <span class="range"> → {{ evento()!.dataFine | date:rangeFormat():'':'it' }}</span>
              }
            </span>
            @if (evento()!.luogo) {
              <span class="meta-item"><span class="ico">📍</span>{{ evento()!.luogo }}</span>
            }
          </div>

          @if (evento()!.descrizione) {
            <div class="article-body">{{ evento()!.descrizione }}</div>
          }
        </article>
      } @else {
        <p class="empty">Evento non trovato.</p>
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; margin-bottom: 1.5rem; color: var(--color-text-muted); font-size: .9rem; }
    .article-img { width: 100%; max-height: 400px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1.5rem; }
    .article h1 { margin-bottom: .75rem; }
    .event-meta { display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; margin-bottom: 1.25rem; }
    .meta-item { display: inline-flex; align-items: center; gap: .4rem; color: var(--color-text-muted); }
    .meta-item .when:first-letter { text-transform: capitalize; }
    .range { color: var(--color-text-muted); }
    .article-body { line-height: 1.8; margin-top: 1rem; white-space: pre-line; }
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

  // Stesso giorno → solo orario di fine; giorni diversi → data + orario.
  rangeFormat(): string {
    const e = this.evento();
    const sameDay =
      e?.dataFine && new Date(e.dataInizio).toDateString() === new Date(e.dataFine).toDateString();
    return sameDay ? 'HH:mm' : 'd MMMM, HH:mm';
  }
}
