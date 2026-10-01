import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { GrestService } from '../../core/services/grest.service';
import { GrestDatiFamiglia, messaggioErrore } from '../../core/models/grest.model';
import { GrestDatiFamigliaComponent, datiFamigliaVuoti } from './grest-dati-famiglia.component';

@Component({
  selector: 'app-grest-registrazione',
  standalone: true,
  imports: [FormsModule, RouterLink, GrestDatiFamigliaComponent],
  styleUrls: ['./grest.scss'],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>Iscrizione al Grest {{ stato()?.anno }}</h1>
        <p>Primo passo: i dati della famiglia. Riceverete un'email per attivare l'account e completare i moduli.</p>
      </div>
    </section>

    <div class="container page-content">
      <div class="box form-wide">
        @if (fatto(); as r) {
          <div class="alert alert-ok">
            <strong>Registrazione completata!</strong>
            Il nome utente è <strong>{{ r.username }}</strong>.
          </div>
          @if (r.emailInviata) {
            <p>Vi abbiamo inviato un'email con il link per scegliere la password e attivare l'account.
               Se non la trovate, controllate anche nella posta indesiderata.</p>
          } @else {
            <p>Non è stato possibile inviare l'email di attivazione: contattate la parrocchia indicando
               il nome utente, vi invieremo il link.</p>
          }
          <a routerLink="/grest/accedi" class="btn btn-primary">Vai all'accesso</a>
        } @else if (stato() && !stato()!.iscrizioniAperte) {
          <p class="muted">{{ stato()!.postiEsauriti ? 'I posti disponibili sono esauriti.' : 'Le iscrizioni non sono aperte in questo momento.' }}</p>
          <a routerLink="/grest/accedi" class="btn btn-outline">Accedi al portale</a>
        } @else {
          <form (ngSubmit)="registra()" #f="ngForm">
            <app-grest-dati-famiglia [dati]="dati" />
            @if (error()) {
              <div class="alert alert-error">{{ error() }}</div>
            }
            <p class="privacy">Registrandovi dichiarate di aver letto la <a routerLink="/p/privacy">privacy policy</a>.
              Potrete chiedere la cancellazione dell'account e dei dati in qualsiasi momento dall'area riservata.</p>
            <div class="actions">
              <button type="submit" class="btn btn-primary" [disabled]="loading() || !f.valid">
                {{ loading() ? 'Invio in corso…' : 'Registra' }}
              </button>
              <a routerLink="/grest/accedi">Avete già un account? Accedete</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .form-wide { max-width: 860px; margin: 0 auto; }
    .privacy { font-size: .85rem; color: var(--color-text-muted); margin: .5rem 0 0; }
  `],
})
export class GrestRegistrazioneComponent {
  private grest = inject(GrestService);

  readonly stato = toSignal(this.grest.stato().pipe(catchError(() => of(null))), { initialValue: null });

  dati: GrestDatiFamiglia = datiFamigliaVuoti();
  readonly loading = signal(false);
  readonly error = signal('');
  readonly fatto = signal<{ username: string; emailInviata: boolean } | null>(null);

  registra(): void {
    const d = this.dati;
    const padre = d.nomePadre && d.cognomePadre && d.emailPadre && d.mobilePhonePadre;
    const madre = d.nomeMadre && d.cognomeMadre && d.emailMadre && d.mobilePhoneMadre;
    if (!padre && !madre) {
      this.error.set('Inserite nome, cognome, email e cellulare di almeno uno dei due genitori.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.grest.registra(this.dati).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.fatto.set(r);
        window.scrollTo({ top: 0 });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Registrazione non riuscita. Riprova più tardi.'));
      },
    });
  }
}
