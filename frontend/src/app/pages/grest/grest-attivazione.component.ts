import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GrestService } from '../../core/services/grest.service';
import { messaggioErrore } from '../../core/models/grest.model';

// Link ricevuto via email: attivazione del nuovo account o reimpostazione della password.
@Component({
  selector: 'app-grest-attivazione',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrls: ['./grest.scss'],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>{{ info()?.attivo ? 'Nuova password' : 'Attivazione account' }} Grest</h1>
      </div>
    </section>

    <div class="container page-content">
      <div class="box narrow">
        @if (stato() === 'caricamento') {
          <p class="empty">Verifica del link…</p>
        } @else if (stato() === 'invalido') {
          <div class="alert alert-error">Il link non è valido oppure è già stato utilizzato.</div>
          <p class="muted">Se avete già scelto la password, accedete normalmente. Altrimenti contattate
            la parrocchia per ricevere un nuovo link.</p>
          <a routerLink="/grest/accedi" class="btn btn-outline">Vai all'accesso</a>
        } @else if (stato() === 'fatto') {
          <div class="alert alert-ok">Password salvata: ora potete accedere al portale.</div>
          <a routerLink="/grest/accedi" class="btn btn-primary">Accedi</a>
        } @else {
          <p>Account di <strong>{{ info()!.nomeFiglio }}</strong> — nome utente:
            <strong>{{ info()!.username }}</strong></p>
          <p class="muted">Scegliete una password di almeno 8 caratteri e conservate il nome utente:
            vi servirà per accedere.</p>
          @if (error()) {
            <div class="alert alert-error">{{ error() }}</div>
          }
          <form (ngSubmit)="salva()" #f="ngForm">
            <input type="text" name="username" [value]="info()!.username" autocomplete="username" hidden />
            <div class="form-group">
              <label for="password">Password</label>
              <input id="password" name="password" type="password" [(ngModel)]="password"
                     required minlength="8" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label for="conferma">Conferma password</label>
              <input id="conferma" name="conferma" type="password" [(ngModel)]="conferma"
                     required autocomplete="new-password" />
            </div>
            <div class="actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading() || !f.valid">
                {{ loading() ? 'Salvataggio…' : 'Salva password' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class GrestAttivazioneComponent {
  private grest = inject(GrestService);
  private token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  readonly stato = signal<'caricamento' | 'invalido' | 'form' | 'fatto'>('caricamento');
  readonly info = signal<{ username: string; nomeFiglio: string; attivo: boolean } | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  password = '';
  conferma = '';

  constructor() {
    if (!this.token) {
      this.stato.set('invalido');
      return;
    }
    this.grest.infoAttivazione(this.token).subscribe({
      next: (i) => {
        this.info.set(i);
        this.stato.set('form');
      },
      error: () => this.stato.set('invalido'),
    });
  }

  salva(): void {
    if (this.password !== this.conferma) {
      this.error.set('Le due password non coincidono.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.grest.attiva(this.token, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.stato.set('fatto');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Salvataggio non riuscito. Riprova più tardi.'));
      },
    });
  }
}
