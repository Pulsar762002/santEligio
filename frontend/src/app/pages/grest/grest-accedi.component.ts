import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { GrestService } from '../../core/services/grest.service';
import { messaggioErrore } from '../../core/models/grest.model';

@Component({
  selector: 'app-grest-accedi',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrls: ['./grest.scss'],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>Portale Grest {{ stato()?.anno }}</h1>
        <p>Area riservata alle famiglie: iscrizione, autorizzazioni, deleghe e moduli da stampare.</p>
      </div>
    </section>

    <div class="container page-content">
      <div class="box narrow">
        <h2>Accedi</h2>
        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }
        <form (ngSubmit)="accedi()" #f="ngForm">
          <div class="form-group">
            <label for="username">Nome utente</label>
            <input id="username" name="username" [(ngModel)]="username" required
                   autocomplete="username" placeholder="Es. MarioRossi" />
            <span class="hint">Nome e cognome del bambino/a attaccati, come nell'email di conferma.</span>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required
                   autocomplete="current-password" />
          </div>
          <div class="actions">
            <button type="submit" class="btn btn-primary" [disabled]="loading() || !f.valid">
              {{ loading() ? 'Accesso in corso…' : 'Accedi' }}
            </button>
          </div>
        </form>
        <p class="muted aiuto">
          Password dimenticata o email di attivazione non ricevuta? Contattate la parrocchia:
          vi invieremo un nuovo link per scegliere la password.
        </p>
      </div>

      <div class="box narrow nuova">
        <h2>Nuova iscrizione</h2>
        @if (stato()?.iscrizioniAperte) {
          <p>Non avete ancora un account? Registrate vostro figlio/a: riceverete un'email per attivare l'accesso.</p>
          <a routerLink="/grest/registrazione" class="btn btn-outline">Registra un nuovo iscritto</a>
        } @else if (stato()?.postiEsauriti) {
          <p class="muted">I posti disponibili sono esauriti.</p>
        } @else if (stato()) {
          <p class="muted">Le iscrizioni non sono aperte in questo momento.</p>
        }
      </div>

      <p class="indietro"><a routerLink="/p/grest">← Torna alla pagina del Grest</a></p>
    </div>
  `,
  styles: [`
    .box h2 { margin-top: 0; font-size: 1.3rem; }
    .aiuto { font-size: .85rem; margin: 1.25rem 0 0; }
    .nuova { margin-top: 1.5rem; }
    .indietro { text-align: center; margin-top: 1.5rem; }
  `],
})
export class GrestAccediComponent {
  private grest = inject(GrestService);
  private router = inject(Router);

  readonly stato = toSignal(this.grest.stato().pipe(catchError(() => of(null))), { initialValue: null });

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    if (this.grest.isLoggedIn()) this.router.navigate(['/grest/area']);
  }

  accedi(): void {
    this.loading.set(true);
    this.error.set('');
    this.grest.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/grest/area']),
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Accesso non riuscito. Riprova più tardi.'));
      },
    });
  }
}
