import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GrestService } from '../../core/services/grest.service';
import { GrestIscritto, messaggioErrore } from '../../core/models/grest.model';
import { GrestModuloIscrizioneComponent } from './grest-modulo-iscrizione.component';
import { GrestModuloAutorizzazioneComponent } from './grest-modulo-autorizzazione.component';
import { GrestModuloDelegaComponent } from './grest-modulo-delega.component';

type Sezione = 'privacy' | 'iscrizione' | 'autorizzazione' | 'delega' | 'account';

@Component({
  selector: 'app-grest-area',
  standalone: true,
  imports: [
    FormsModule, RouterLink, GrestModuloIscrizioneComponent, GrestModuloAutorizzazioneComponent,
    GrestModuloDelegaComponent,
  ],
  styleUrls: ['./grest.scss'],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>Portale Grest</h1>
        @if (iscritto(); as i) {
          <p>{{ i.nomeFiglio }} {{ i.cognomeFiglio }} · nome utente <strong>{{ i.username }}</strong></p>
        }
      </div>
    </section>

    <div class="container page-content">
      @if (errore()) {
        <div class="alert alert-error">{{ errore() }}</div>
      } @else if (!iscritto()) {
        <p class="empty">Caricamento…</p>
      } @else {
        <div class="layout">
          <nav class="menu" aria-label="Sezioni del portale Grest">
            @for (v of voci; track v.id) {
              <button type="button" [class.attiva]="sezione() === v.id" (click)="vai(v.id)">
                <span>{{ v.label }}</span>
                @if (v.id !== 'privacy' && v.id !== 'account') {
                  <span class="stato" [class.ok]="compilato()[v.id]">{{ compilato()[v.id] ? '✓ Salvato' : 'Da compilare' }}</span>
                }
              </button>
            }
            <button type="button" class="esci" (click)="esci()">Esci</button>
          </nav>

          <div class="box contenuto">
            @switch (sezione()) {
              @case ('privacy') {
                <h2>Informativa privacy</h2>
                <p class="sottotitolo">Regolamento 679/2016/UE</p>
                <p>Ai sensi e per gli effetti dell’articolo 13 del Regolamento 679/2016/UE "General Data Protection
                  Regulation", informiamo che la Parrocchia di Sant’Eligio tratta i dati personali da lei forniti e
                  liberamente comunicati. La Parrocchia di Sant’Eligio garantisce che il trattamento dei suoi dati
                  personali si svolge nel rispetto dei diritti e delle libertà fondamentali, nonché della sua dignità,
                  con particolare riferimento alla riservatezza, all’identità personale e al diritto alla protezione
                  dei dati personali.</p>
                <h3>Come funziona</h3>
                <ol>
                  <li>Compilate e salvate i moduli di <strong>iscrizione</strong>, <strong>autorizzazione</strong>
                    e, se serve, di <strong>delega</strong>.</li>
                  <li>Scaricate i PDF già compilati, stampateli e firmateli.</li>
                  <li>Consegnateli in parrocchia insieme ai documenti richiesti.</li>
                </ol>
                <button class="btn btn-primary" (click)="vai('iscrizione')">Inizia dal modulo di iscrizione</button>
              }
              @case ('iscrizione') {
                <h2>Modulo di iscrizione</h2>
                <app-grest-modulo-iscrizione [iscritto]="iscritto()!" (salvato)="iscritto.set($event)" />
              }
              @case ('autorizzazione') {
                <h2>Modulo di autorizzazione</h2>
                <app-grest-modulo-autorizzazione [iscritto]="iscritto()!" (salvato)="iscritto.set($event)" />
              }
              @case ('delega') {
                <h2>Modulo di delega</h2>
                <app-grest-modulo-delega [iscritto]="iscritto()!" (salvato)="iscritto.set($event)" />
              }
              @case ('account') {
                <h2>Cambia password</h2>
                @if (pwdErrore()) { <div class="alert alert-error">{{ pwdErrore() }}</div> }
                @if (pwdOk()) { <div class="alert alert-ok">Password aggiornata.</div> }
                <form (ngSubmit)="cambiaPassword()" #pf="ngForm" class="pwd">
                  <input type="text" name="username" [value]="iscritto()!.username" autocomplete="username" hidden />
                  <div class="form-group">
                    <label for="attuale">Password attuale</label>
                    <input id="attuale" name="attuale" type="password" [(ngModel)]="pwd.attuale" required
                           autocomplete="current-password" />
                  </div>
                  <div class="form-group">
                    <label for="nuova">Nuova password (almeno 8 caratteri)</label>
                    <input id="nuova" name="nuova" type="password" [(ngModel)]="pwd.nuova" required minlength="8"
                           autocomplete="new-password" />
                  </div>
                  <div class="form-group">
                    <label for="conferma">Conferma nuova password</label>
                    <input id="conferma" name="conferma" type="password" [(ngModel)]="pwd.conferma" required
                           autocomplete="new-password" />
                  </div>
                  <button type="submit" class="btn btn-primary" [disabled]="!pf.valid">Salva password</button>
                </form>
              }
            }
          </div>
        </div>
      }
      <p class="indietro"><a routerLink="/p/grest">← Pagina del Grest</a></p>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: 240px 1fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 820px) { .layout { grid-template-columns: 1fr; } }
    .menu { display: flex; flex-direction: column; gap: .5rem; position: sticky; top: 1rem; }
    @media (max-width: 820px) { .menu { position: static; flex-direction: row; flex-wrap: wrap; } }
    .menu button {
      display: flex; flex-direction: column; align-items: flex-start; gap: .15rem;
      text-align: left; padding: .7rem .9rem; background: white; cursor: pointer;
      border: 1px solid var(--color-border); border-radius: var(--radius);
      font: inherit; font-weight: 600; color: var(--color-text);
    }
    .menu button:hover { border-color: var(--color-primary); }
    .menu button.attiva { border-color: var(--color-primary); background: var(--color-bg-alt); color: var(--color-primary-dark); }
    .menu .stato { font-size: .75rem; font-weight: 500; color: #b45309; }
    .menu .stato.ok { color: #166534; }
    .menu .esci { color: var(--color-text-muted); font-weight: 500; }
    .contenuto h2 { margin-top: 0; }
    .sottotitolo { color: var(--color-text-muted); font-style: italic; margin-top: -.5rem; }
    .pwd { max-width: 380px; }
    .indietro { text-align: center; margin-top: 1.5rem; }
  `],
})
export class GrestAreaComponent {
  private grest = inject(GrestService);
  private router = inject(Router);

  readonly iscritto = signal<GrestIscritto | null>(null);
  readonly errore = signal('');
  readonly sezione = signal<Sezione>('privacy');

  readonly voci: { id: Sezione; label: string }[] = [
    { id: 'privacy', label: 'Informativa e istruzioni' },
    { id: 'iscrizione', label: 'Iscrizione' },
    { id: 'autorizzazione', label: 'Autorizzazione' },
    { id: 'delega', label: 'Delega' },
    { id: 'account', label: 'Cambia password' },
  ];

  readonly compilato = computed<Record<string, boolean>>(() => {
    const i = this.iscritto();
    return {
      iscrizione: !!i?.consenso,
      autorizzazione: !!i?.autorizzazione,
      delega: !!i?.delega?.delegati?.length,
    };
  });

  pwd = { attuale: '', nuova: '', conferma: '' };
  readonly pwdErrore = signal('');
  readonly pwdOk = signal(false);

  constructor() {
    this.grest.me().subscribe({
      next: (i) => this.iscritto.set(i),
      error: (err) => {
        if (err?.status === 401) {
          this.esci();
        } else {
          this.errore.set('Impossibile caricare i dati. Riprovate più tardi.');
        }
      },
    });
  }

  vai(s: Sezione): void {
    this.sezione.set(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cambiaPassword(): void {
    this.pwdErrore.set('');
    this.pwdOk.set(false);
    if (this.pwd.nuova !== this.pwd.conferma) {
      this.pwdErrore.set('Le due password non coincidono.');
      return;
    }
    this.grest.cambiaPassword(this.pwd.attuale, this.pwd.nuova).subscribe({
      next: () => {
        this.pwdOk.set(true);
        this.pwd = { attuale: '', nuova: '', conferma: '' };
      },
      error: (err) => this.pwdErrore.set(messaggioErrore(err, 'Cambio password non riuscito.')),
    });
  }

  esci(): void {
    this.grest.logout();
    this.router.navigate(['/grest/accedi']);
  }
}
