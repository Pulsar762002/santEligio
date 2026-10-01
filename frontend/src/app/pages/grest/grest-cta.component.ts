import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { GrestService } from '../../core/services/grest.service';

// Riquadro con l'accesso al portale iscrizioni, mostrato sotto il contenuto della pagina /p/grest
// (il testo della pagina resta modificabile da Admin → Pagine).
@Component({
  selector: 'app-grest-cta',
  standalone: true,
  imports: [RouterLink],
  template: `
    <aside class="cta">
      <div>
        <h2>Portale iscrizioni Grest {{ stato()?.anno }}</h2>
        <p>Iscrizione, autorizzazioni, deleghe e moduli PDF già compilati da stampare e firmare.</p>
      </div>
      <div class="bottoni">
        <a routerLink="/grest/accedi" class="btn btn-primary">Accedi al portale Grest</a>
        @if (stato()?.iscrizioniAperte) {
          <a routerLink="/grest/registrazione" class="btn btn-outline">Nuova iscrizione</a>
        }
      </div>
    </aside>
  `,
  styles: [`
    .cta {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 1.5rem;
      margin: 2rem 0 0; padding: 1.4rem 1.6rem;
      background: var(--color-bg-alt); border: 1px solid var(--color-border);
      border-left: 5px solid var(--color-secondary); border-radius: var(--radius);
    }
    h2 { margin: 0 0 .3rem; font-size: 1.25rem; color: var(--color-primary-dark); }
    p { margin: 0; color: var(--color-text-muted); }
    .bottoni { display: flex; gap: .75rem; flex-wrap: wrap; }
  `],
})
export class GrestCtaComponent {
  readonly stato = toSignal(inject(GrestService).stato().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
}
