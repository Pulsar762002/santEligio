import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventiService } from '../../core/services/eventi.service';
import { EventCardComponent } from '../../shared/event-card/event-card.component';
import { Evento } from '../../core/models/evento.model';

function isFuturo(evento: Evento): boolean {
  const now = new Date();
  return evento.dataFine ? new Date(evento.dataFine) >= now : new Date(evento.dataInizio) >= now;
}

@Component({
  selector: 'app-eventi',
  standalone: true,
  imports: [EventCardComponent],
  template: `
    <div class="container page-content">
      <header class="page-head">
        <h1>Eventi</h1>
        <p class="subtitle">Appuntamenti e celebrazioni della comunità</p>
      </header>

      @if (inEvidenza().length > 0) {
        <section class="evidenza" aria-label="Eventi in evidenza">
          @for (evento of inEvidenza(); track evento._id) {
            <app-event-card [evento]="evento" [featured]="true" />
          }
        </section>
      }

      @if (altriFuturi().length > 0) {
        @if (inEvidenza().length > 0) {
          <div class="past-divider"><span>In programma</span></div>
        }
        <div class="event-list">
          @for (evento of altriFuturi(); track evento._id) {
            <app-event-card [evento]="evento" />
          }
        </div>
      } @else if (eventiFuturi().length === 0 && eventiPassati().length === 0) {
        <div class="empty-state">
          <p class="empty">Al momento non ci sono eventi in programma.</p>
        </div>
      }

      @if (eventiPassati().length > 0) {
        <div class="past-divider"><span>Eventi passati</span></div>
        <div class="event-list past">
          @for (evento of eventiPassati(); track evento._id) {
            <app-event-card [evento]="evento" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 1.75rem; }
    .page-head h1 { margin-bottom: .25rem; }
    .subtitle { color: var(--color-text-muted); font-size: 1.05rem; margin: 0; }
    .event-list { display: grid; gap: 1rem; }
    .evidenza { display: grid; gap: 1.25rem; margin-bottom: 1rem; }
    .event-list.past { opacity: .8; }
    .empty-state { text-align: center; padding: 3rem 1rem; background: var(--color-bg-alt); border-radius: var(--radius); }

    .past-divider {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin: 2.5rem 0 1rem;
      color: var(--color-text-muted);
      font-size: .9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    .past-divider::before, .past-divider::after {
      content: '';
      flex: 1 1 auto;
      height: 1px;
      background: var(--color-border);
    }
  `],
})
export class EventiComponent {
  private eventiService = inject(EventiService);
  private readonly eventi = toSignal(this.eventiService.getAll(), { initialValue: [] as Evento[] });

  readonly eventiFuturi = computed(() => this.eventi().filter(isFuturo));
  readonly inEvidenza = computed(() => this.eventiFuturi().filter((e) => e.inEvidenza));
  readonly altriFuturi = computed(() => this.eventiFuturi().filter((e) => !e.inEvidenza));
  // dal più recente: l'API ordina per data di inizio crescente
  readonly eventiPassati = computed(() => this.eventi().filter((e) => !isFuturo(e)).reverse());
}
