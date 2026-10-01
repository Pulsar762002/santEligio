import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { etichettaRuolo } from '../../core/models/utente.model';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container page-content">
      <div class="box">
        <h1>Il mio profilo</h1>
        @if (auth.me(); as me) {
          <dl>
            <dt>Nome</dt><dd>{{ me.nome || '—' }}</dd>
            <dt>Email</dt><dd>{{ me.email }}</dd>
            <dt>Ruolo</dt><dd>{{ ruolo() }}</dd>
            @if (me.areeDettaglio.length) {
              <dt>Aree</dt><dd>{{ aree() }}</dd>
            }
          </dl>
          @if (auth.isStaff()) {
            <a routerLink="/admin" class="btn btn-outline">Vai al pannello</a>
          }
        }

        <h2>Cambia password</h2>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        @if (ok()) { <div class="alert alert-ok">Password aggiornata.</div> }
        <form (ngSubmit)="salva()" #f="ngForm">
          <input type="text" name="username" [value]="auth.me()?.email ?? ''" autocomplete="username" hidden />
          <div class="form-group">
            <label for="attuale">Password attuale</label>
            <input id="attuale" name="attuale" type="password" [(ngModel)]="attuale" required autocomplete="current-password" />
          </div>
          <div class="form-group">
            <label for="nuova">Nuova password (almeno 8 caratteri)</label>
            <input id="nuova" name="nuova" type="password" [(ngModel)]="nuova" required minlength="8" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label for="conferma">Conferma nuova password</label>
            <input id="conferma" name="conferma" type="password" [(ngModel)]="conferma" required autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="!f.valid">Salva password</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .box { max-width: 520px; margin: 0 auto; background: white; border: 1px solid var(--color-border);
           border-radius: var(--radius); padding: 1.75rem; }
    h1 { margin-top: 0; }
    h2 { font-size: 1.15rem; margin-top: 2rem; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: .35rem 1rem; margin: 0 0 1.25rem; }
    dt { color: var(--color-text-muted); }
    dd { margin: 0; }
    .alert-ok { background: #e7f6ec; color: #166534; border: 1px solid #86efac; }
  `],
})
export class ProfiloComponent {
  protected auth = inject(AuthService);
  readonly ruolo = computed(() => etichettaRuolo(this.auth.ruolo() ?? 'utente'));
  readonly aree = computed(() => (this.auth.me()?.areeDettaglio ?? []).map((a) => a.nome).join(', '));

  attuale = '';
  nuova = '';
  conferma = '';
  readonly error = signal('');
  readonly ok = signal(false);

  salva(): void {
    this.error.set('');
    this.ok.set(false);
    if (this.nuova !== this.conferma) {
      this.error.set('Le due password non coincidono.');
      return;
    }
    this.auth.cambiaPassword(this.attuale, this.nuova).subscribe({
      next: () => {
        this.ok.set(true);
        this.attuale = this.nuova = this.conferma = '';
      },
      error: (err) => {
        const m = err?.error?.message;
        this.error.set(Array.isArray(m) ? m.join('. ') : m || 'Cambio password non riuscito.');
      },
    });
  }
}
