import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Evento } from '../../core/models/evento.model';
import { assetUrl } from '../../core/utils/asset-url';
import { etichettaStato, giorniEvento, statoEvento } from '../../core/utils/durata-evento';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <a class="event-card" [class.has-img]="evento.immagine" [class.featured]="featured"
       [class.in-corso]="stato() === 'in-corso'" [routerLink]="['/eventi', evento._id]">
      @if (evento.immagine) {
        <img class="event-thumb" [src]="src(evento.immagine)" [alt]="evento.titolo" loading="lazy" />
      }
      <div class="main">
        @if (piuGiorni()) {
          <div class="date-chip range" [attr.aria-label]="'Dal ' + (evento.dataInizio | date:'d MMMM':'':'it') + ' al ' + (evento.dataFine | date:'d MMMM yyyy':'':'it')">
            <span class="day">{{ evento.dataInizio | date:'d':'':'it' }}</span>
            <span class="month">{{ evento.dataInizio | date:'MMM':'':'it' }}</span>
            <span class="arrow" aria-hidden="true">↓</span>
            <span class="day">{{ evento.dataFine | date:'d':'':'it' }}</span>
            <span class="month">{{ evento.dataFine | date:'MMM':'':'it' }}</span>
            <span class="year">{{ evento.dataFine | date:'yyyy':'':'it' }}</span>
          </div>
        } @else {
          <div class="date-chip">
            <span class="day">{{ evento.dataInizio | date:'d':'':'it' }}</span>
            <span class="month">{{ evento.dataInizio | date:'MMM':'':'it' }}</span>
            <span class="year">{{ evento.dataInizio | date:'yyyy':'':'it' }}</span>
          </div>
        }

        <div class="event-body">
          @if (featured || etichetta() || piuGiorni()) {
            <div class="badges">
              @if (featured) { <span class="badge star">★ In evidenza</span> }
              @if (etichetta()) { <span class="badge stato" [class.live]="stato() === 'in-corso'">{{ etichetta() }}</span> }
              @if (piuGiorni()) { <span class="badge durata">{{ giorni() }} giorni</span> }
            </div>
          }

          <h3>{{ evento.titolo }}</h3>

          <div class="meta">
            @if (piuGiorni()) {
              <span class="meta-item periodo">
                <span class="ico">🗓️</span>
                <span>
                  <span class="lbl">Dal</span> {{ evento.dataInizio | date:'EEEE d MMMM, HH:mm':'':'it' }}<br />
                  <span class="lbl">al</span> {{ evento.dataFine | date:fineFormat():'':'it' }}
                </span>
              </span>
            } @else {
              <span class="meta-item when">
                <span class="ico">🕒</span>
                <span><span class="d">{{ evento.dataInizio | date:'EEEE d MMMM, HH:mm':'':'it' }}</span>@if (evento.dataFine) {<span class="range"> → {{ evento.dataFine | date:'HH:mm':'':'it' }}</span>}</span>
              </span>
            }
            @if (evento.luogo) {
              <span class="meta-item"><span class="ico">📍</span>{{ evento.luogo }}</span>
            }
          </div>

          @if (showDescription && evento.descrizione) {
            <p class="desc">{{ plainText(evento.descrizione) }}</p>
          }
        </div>
      </div>
    </a>
  `,
  styles: [`
    :host { display: block; }

    .event-card {
      display: flex;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      border-left: 4px solid var(--color-primary);
      box-shadow: 0 1px 3px rgba(0,0,0,.04);
      transition: box-shadow .15s, transform .15s;
      color: inherit;
      text-decoration: none;
    }
    .event-card:hover { box-shadow: 0 8px 22px rgba(0,0,0,.09); transform: translateY(-2px); text-decoration: none; }
    .event-card h3 { color: var(--color-primary-dark); }
    .event-card.in-corso { border-left-color: #15803d; }

    .main { display: flex; gap: 1.25rem; flex: 1 1 auto; min-width: 0; }

    .date-chip {
      flex: 0 0 auto;
      width: 72px;
      align-self: flex-start;
      text-align: center;
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border: 1px solid color-mix(in srgb, var(--color-primary) 22%, white);
      border-radius: var(--radius);
      padding: .5rem .25rem;
      line-height: 1.1;
    }
    .date-chip .day { display: block; font-size: 1.7rem; font-weight: 800; color: var(--color-primary-dark); }
    .date-chip .month { display: block; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; color: var(--color-primary); font-weight: 700; }
    .date-chip .year { display: block; font-size: .72rem; color: var(--color-text-muted); margin-top: .1rem; }
    .date-chip.range .day { font-size: 1.35rem; }
    .date-chip .arrow { display: block; font-size: .8rem; color: var(--color-text-muted); margin: .1rem 0; }

    .event-body { flex: 1 1 auto; min-width: 0; }
    .event-body h3 { margin: 0 0 .5rem; font-size: 1.2rem; }

    .badges { display: flex; flex-wrap: wrap; gap: .35rem; margin-bottom: .45rem; }
    .badge {
      font-size: .74rem; font-weight: 700; letter-spacing: .02em;
      padding: .15rem .55rem; border-radius: 999px; white-space: nowrap; text-transform: none; margin-top: 0;
      background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border);
    }
    .badge.stato { background: color-mix(in srgb, var(--color-primary) 10%, white); color: var(--color-primary-dark);
                   border-color: color-mix(in srgb, var(--color-primary) 30%, white); }
    .badge.stato.live { background: #e7f6ec; color: #166534; border-color: #86efac; }
    .badge.star { background: color-mix(in srgb, var(--color-secondary) 16%, white); color: #7a5f0c;
                  border-color: color-mix(in srgb, var(--color-secondary) 55%, white); }

    .meta { display: flex; flex-wrap: wrap; gap: .4rem 1.1rem; margin-bottom: .5rem; }
    .meta-item { display: inline-flex; align-items: center; gap: .35rem; font-size: .88rem; color: var(--color-text-muted); }
    .meta-item .ico { font-size: .85rem; }
    .meta-item.when { align-items: flex-start; }
    .meta-item.when .d { display: inline-block; }
    .meta-item.when .d:first-letter { text-transform: capitalize; }
    .meta-item.periodo { align-items: flex-start; color: var(--color-text); line-height: 1.45; }
    .periodo .lbl { display: inline-block; min-width: 1.7em; color: var(--color-text-muted); }
    .range { color: var(--color-text-muted); }

    .desc { margin: .25rem 0 0; font-size: .95rem; color: var(--color-text); }

    .event-thumb {
      order: 3;
      flex: 0 0 auto;
      align-self: center;
      width: 150px;
      height: 105px;
      object-fit: cover;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
    }

    /* ── In evidenza: card grande, immagine larga in alto, bordo oro ── */
    .event-card.featured {
      flex-direction: column;
      gap: 0;
      padding: 0;
      overflow: hidden;
      border: 2px solid var(--color-secondary);
      border-left-width: 2px;
      background: linear-gradient(180deg, color-mix(in srgb, var(--color-secondary) 7%, white), white 60%);
      box-shadow: 0 6px 20px rgba(0,0,0,.08);
    }
    /* contain: i volantini (spesso verticali) restano interi */
    .featured .event-thumb {
      order: -1; align-self: stretch; width: 100%; height: 340px; object-fit: contain;
      background: var(--color-bg-alt);
      border: none; border-radius: 0; border-bottom: 1px solid var(--color-border);
    }
    .featured .main { padding: 1.4rem 1.6rem 1.5rem; }
    .featured .event-body h3 { font-size: 1.55rem; }
    .featured .meta-item { font-size: .95rem; }
    .featured .date-chip { border-color: color-mix(in srgb, var(--color-secondary) 55%, white);
                           background: color-mix(in srgb, var(--color-secondary) 10%, white); }

    @media (max-width: 600px) {
      .event-card { flex-wrap: wrap; }
      .event-thumb { order: 4; width: 100%; height: 160px; }
      .featured .event-thumb { order: -1; height: auto; max-height: 300px; }
      .featured .main { padding: 1.1rem 1.1rem 1.2rem; gap: .9rem; }
      .featured .event-body h3 { font-size: 1.3rem; }
    }
  `],
})
export class EventCardComponent {
  @Input({ required: true }) evento!: Evento;
  @Input() showDescription = true;
  /** Card grande per gli eventi in evidenza. */
  @Input() featured = false;

  src = assetUrl;

  piuGiorni = () => giorniEvento(this.evento) > 1;
  giorni = () => giorniEvento(this.evento);
  stato = () => statoEvento(this.evento);
  etichetta = () => etichettaStato(this.evento);

  plainText(html: string): string {
    const max = this.featured ? 280 : 150;
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  // Anno sulla data di fine solo se l'evento attraversa il capodanno.
  fineFormat(): string {
    const e = this.evento;
    const anniDiversi = new Date(e.dataInizio).getFullYear() !== new Date(e.dataFine!).getFullYear();
    return anniDiversi ? 'EEEE d MMMM yyyy, HH:mm' : 'EEEE d MMMM, HH:mm';
  }
}
