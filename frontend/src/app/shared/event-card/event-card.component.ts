import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Evento } from '../../core/models/evento.model';
import { assetUrl } from '../../core/utils/asset-url';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <a class="event-card" [class.has-img]="evento.immagine" [routerLink]="['/eventi', evento._id]">
      @if (evento.immagine) {
        <img class="event-thumb" [src]="src(evento.immagine)" [alt]="evento.titolo" loading="lazy" />
      }
      <div class="date-chip">
        <span class="day">{{ evento.dataInizio | date:'d':'':'it' }}</span>
        <span class="month">{{ evento.dataInizio | date:'MMM':'':'it' }}</span>
        <span class="year">{{ evento.dataInizio | date:'yyyy':'':'it' }}</span>
      </div>

      <div class="event-body">
        <h3>{{ evento.titolo }}</h3>

        <div class="meta">
          <span class="meta-item">
            <span class="ico">🕒</span>
            {{ evento.dataInizio | date:'EEEE d MMMM, HH:mm':'':'it' }}
            @if (evento.dataFine) {
              <span class="range"> → {{ evento.dataFine | date:rangeFormat():'':'it' }}</span>
            }
          </span>
          @if (evento.luogo) {
            <span class="meta-item"><span class="ico">📍</span>{{ evento.luogo }}</span>
          }
        </div>

        @if (showDescription && evento.descrizione) {
          <p class="desc">{{ evento.descrizione }}</p>
        }
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

    .event-body { flex: 1 1 auto; min-width: 0; }
    .event-body h3 { margin: 0 0 .5rem; font-size: 1.2rem; }

    .meta { display: flex; flex-wrap: wrap; gap: .4rem 1.1rem; margin-bottom: .5rem; }
    .meta-item { display: inline-flex; align-items: center; gap: .35rem; font-size: .88rem; color: var(--color-text-muted); }
    .meta-item .ico { font-size: .85rem; }
    .meta-item:first-letter { text-transform: capitalize; }
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
    @media (max-width: 600px) {
      .event-card { flex-wrap: wrap; }
      .event-thumb { order: 4; width: 100%; height: 160px; }
    }
  `],
})
export class EventCardComponent {
  @Input({ required: true }) evento!: Evento;
  @Input() showDescription = true;

  src = assetUrl;

  // Stesso giorno → solo orario di fine; giorni diversi → data + orario.
  rangeFormat(): string {
    const e = this.evento;
    const sameDay =
      e.dataFine && new Date(e.dataInizio).toDateString() === new Date(e.dataFine).toDateString();
    return sameDay ? 'HH:mm' : 'd MMMM, HH:mm';
  }
}
