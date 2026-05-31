import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EventiService } from '../../core/services/eventi.service';
import { EventCardComponent } from '../../shared/event-card/event-card.component';

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

      @if (eventi() && eventi()!.length > 0) {
        <div class="event-list">
          @for (evento of eventi()!; track evento._id) {
            <app-event-card [evento]="evento" />
          }
        </div>
      } @else {
        <div class="empty-state">
          <p class="empty">Al momento non ci sono eventi in programma.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 1.75rem; }
    .page-head h1 { margin-bottom: .25rem; }
    .subtitle { color: var(--color-text-muted); font-size: 1.05rem; margin: 0; }
    .event-list { display: grid; gap: 1rem; }
    .empty-state { text-align: center; padding: 3rem 1rem; background: var(--color-bg-alt); border-radius: var(--radius); }
  `],
})
export class EventiComponent {
  private eventiService = inject(EventiService);
  readonly eventi = toSignal(this.eventiService.getAll());
}
