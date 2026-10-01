import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, switchMap, tap } from 'rxjs';
import { GrestService, salvaFile } from '../../core/services/grest.service';
import {
  ANNI_CATECHISMO, GrestIscritto, GrestIscrizione, TAGLIE, TESTO_RESPONSABILITA, TESTO_USCITA1,
  messaggioErrore,
} from '../../core/models/grest.model';
import { GrestDatiFamigliaComponent } from './grest-dati-famiglia.component';

function daIscritto(i: GrestIscritto): GrestIscrizione {
  return {
    nomePadre: i.nomePadre, cognomePadre: i.cognomePadre, emailPadre: i.emailPadre,
    mobilePhonePadre: i.mobilePhonePadre, nomeMadre: i.nomeMadre, cognomeMadre: i.cognomeMadre,
    emailMadre: i.emailMadre, mobilePhoneMadre: i.mobilePhoneMadre, nomeFiglio: i.nomeFiglio,
    cognomeFiglio: i.cognomeFiglio, natoA: i.natoA, natoIl: i.natoIl, residenteA: i.residenteA,
    via: i.via, annoCatechismo: i.annoCatechismo, annoElementari: i.annoElementari, taglia: i.taglia,
    altroContatto: i.altroContatto, mobilePhoneAltro: i.mobilePhoneAltro,
    altroDaSegnalare: i.altroDaSegnalare, uscita1: !!i.uscita1, consenso: i.consenso,
  };
}

@Component({
  selector: 'app-grest-modulo-iscrizione',
  standalone: true,
  imports: [FormsModule, GrestDatiFamigliaComponent],
  styleUrls: ['./grest.scss'],
  template: `
    <form (ngSubmit)="salva(false)" #f="ngForm">
      <app-grest-dati-famiglia [dati]="dati" />

      <fieldset>
        <legend>Iscrizione</legend>
        <div class="row-2">
          <div class="form-group">
            <label for="annoCatechismo" class="req">Iscrizione al catechismo</label>
            <select id="annoCatechismo" name="annoCatechismo" [(ngModel)]="dati.annoCatechismo" required>
              <option value="" disabled>Seleziona…</option>
              @for (a of anni; track a.value) { <option [value]="a.value">{{ a.label }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label for="annoElementari" class="req">Classe frequentata</label>
            <input id="annoElementari" name="annoElementari" [(ngModel)]="dati.annoElementari" required
                   maxlength="40" placeholder="Es. 3ª elementare" />
          </div>
          <div class="form-group">
            <label for="altroContatto">Altro contatto (nome e cognome)</label>
            <input id="altroContatto" name="altroContatto" [(ngModel)]="dati.altroContatto" maxlength="120" />
          </div>
          <div class="form-group">
            <label for="mobilePhoneAltro">Cellulare altro contatto</label>
            <input id="mobilePhoneAltro" name="mobilePhoneAltro" inputmode="numeric" pattern="[0-9]*"
                   [(ngModel)]="dati.mobilePhoneAltro" maxlength="20" #ca="ngModel" />
            @if (ca.invalid) { <span class="hint obbligatoria">Solo cifre, senza spazi.</span> }
          </div>
          <div class="form-group">
            <label for="taglia" class="req">Taglia T-Shirt</label>
            <select id="taglia" name="taglia" [(ngModel)]="dati.taglia" required>
              <option value="" disabled>Seleziona una taglia</option>
              @for (t of taglie; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="altroDaSegnalare">Note</label>
          <textarea id="altroDaSegnalare" name="altroDaSegnalare" rows="3" maxlength="2000"
                    [(ngModel)]="dati.altroDaSegnalare"></textarea>
        </div>
      </fieldset>

      <fieldset>
        <legend>Partecipazione alle uscite</legend>
        <p>Intendo iscrivere mio figlio alla seguente uscita, consapevole che l’iscrizione è vincolante al
          pagamento della quota prevista in quanto la Parrocchia sulla base del numero degli iscritti dovrà
          prenotare pullman e strutture:</p>
        <label class="check">
          <input type="checkbox" name="uscita1" [(ngModel)]="dati.uscita1" />
          <span>{{ testoUscita }}</span>
        </label>
      </fieldset>

      <label class="check responsabilita">
        <input type="checkbox" name="consenso" [(ngModel)]="dati.consenso" required />
        <span><strong>Sì.</strong> {{ testoResponsabilita }}</span>
      </label>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (ok()) { <div class="alert alert-ok">{{ ok() }}</div> }

      <div class="actions">
        <button type="submit" class="btn btn-outline" [disabled]="loading() || !f.valid || !dati.consenso">
          Salva
        </button>
        <button type="button" class="btn btn-primary" (click)="salva(true)"
                [disabled]="loading() || !f.valid || !dati.consenso">
          {{ loading() ? 'Attendere…' : 'Salva e scarica il modulo PDF' }}
        </button>
      </div>
    </form>
  `,
  styles: [`.responsabilita { background: var(--color-bg-alt); padding: .85rem 1rem; border-radius: var(--radius); }`],
})
export class GrestModuloIscrizioneComponent implements OnChanges {
  private grest = inject(GrestService);

  @Input({ required: true }) iscritto!: GrestIscritto;
  @Output() salvato = new EventEmitter<GrestIscritto>();

  readonly anni = ANNI_CATECHISMO;
  readonly taglie = TAGLIE;
  readonly testoUscita = TESTO_USCITA1;
  readonly testoResponsabilita = TESTO_RESPONSABILITA;

  dati!: GrestIscrizione;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ok = signal('');

  ngOnChanges(): void {
    this.dati = daIscritto(this.iscritto);
  }

  salva(scarica: boolean): void {
    const d = this.dati;
    if (!(d.nomePadre && d.cognomePadre && d.emailPadre && d.mobilePhonePadre) &&
        !(d.nomeMadre && d.cognomeMadre && d.emailMadre && d.mobilePhoneMadre)) {
      this.error.set('Inserite nome, cognome, email e cellulare di almeno uno dei due genitori.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.ok.set('');
    this.grest.salvaIscrizione(this.dati).pipe(
      tap((i) => this.salvato.emit(i)),
      switchMap(() => (scarica ? this.grest.scaricaModulo('iscrizione') : of(null))),
    ).subscribe({
      next: (pdf) => {
        this.loading.set(false);
        if (pdf) salvaFile(pdf, 'modulo_iscrizione.pdf');
        this.ok.set(pdf
          ? 'Dati salvati e modulo scaricato: stampatelo, firmatelo e consegnatelo in parrocchia.'
          : 'Modulo di iscrizione salvato.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Salvataggio non riuscito. Controllate i campi e riprovate.'));
      },
    });
  }
}
