import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventiService } from '../../core/services/eventi.service';

@Component({
  selector: 'app-eventi',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container page-content">
      <h1>Eventi</h1>

      @if (eventi() && eventi()!.length > 0) {
        <ul class="event-list">
          @for (evento of eventi()!; track evento._id) {
            <li class="event-card">
              <div class="event-dates">
                <span class="date-start">{{ evento.dataInizio | date:'d MMM':'':'it' }}</span>
                @if (evento.dataFine) {
                  <span class="date-sep">&mdash;</span>
                  <span class="date-end">{{ evento.dataFine | date:'d MMM':'':'it' }}</span>
                }
              </div>
              <div class="event-body">
                <h3>{{ evento.titolo }}</h3>
                @if (evento.luogo) {
                  <p class="luogo">{{ evento.luogo }}</p>
                }
                @if (evento.descrizione) {
                  <p class="desc">{{ evento.descrizione }}</p>
                }
              </div>
            </li>
          }
        </ul>
      } @else {
        <p class="empty">Nessun evento in programma.</p>
      }
    </div>
  `,
  styles: [`
    .event-list { list-style: none; padding: 0; }
    .event-card {
      display: flex;
      gap: 1.5rem;
      padding: 1.25rem;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .event-dates {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 56px;
      font-family: var(--font-heading);
      color: var(--color-primary);
      font-weight: 700;
      font-size: .9rem;
      text-align: center;
    }
    .date-sep { font-size: .7rem; color: var(--color-text-muted); }
    .event-body h3 { margin-bottom: .3rem; font-size: 1.1rem; }
    .luogo { margin: 0; font-size: .85rem; color: var(--color-text-muted); }
    .desc { margin: .5rem 0 0; font-size: .9rem; }
  `],
})
export class EventiComponent {
  private eventiService = inject(EventiService);
  readonly eventi = toSignal(this.eventiService.getAll());
}
