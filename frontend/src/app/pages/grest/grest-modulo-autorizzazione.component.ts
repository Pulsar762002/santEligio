import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { of, switchMap, tap } from 'rxjs';
import { GrestService, salvaFile } from '../../core/services/grest.service';
import {
  GrestAutorizzazione, GrestIscritto, TESTO_RESPONSABILITA, messaggioErrore,
} from '../../core/models/grest.model';

type Chiave = keyof Omit<GrestAutorizzazione, 'allergie' | 'intolleranze' | 'consenso'>;

interface Domanda {
  chiave: Chiave;
  testo: string;
  /** true = sul modulo c'è solo "Sì" (presa visione obbligatoria). */
  soloSi?: boolean;
  nota?: string;
  dettaglio?: 'allergie' | 'intolleranze';
}

// Testi del modulo cartaceo 2026 (identici al vecchio portale).
const DICHIARAZIONI: Domanda[] = [
  { chiave: 'dichiarazione1', testo: 'che il/la figlio/a soffre di particolari problemi di salute:' },
  { chiave: 'dichiarazione2', testo: 'che il/la figlio/figlia soffre di allergie.', dettaglio: 'allergie' },
  { chiave: 'dichiarazione3', testo: 'che il/la figlio/a soffre di intolleranze alimentari.', dettaglio: 'intolleranze' },
  { chiave: 'dichiarazione4',
    testo: 'che il/la figlio/a è certificato dalla Struttura Pubblica ai sensi della Legge 104/1992 e necessita di assistenza individuale e personale.',
    nota: 'In caso affermativo portare cartaceo certificazione.' },
  { chiave: 'dichiarazione5',
    testo: 'che il/la figlio/a necessita di assistenza individuale continua durante il Grest e a tale proposito si impegna a concordare insieme al personale le modalità di frequenza al Cre-Grest.' },
  { chiave: 'dichiarazione6', soloSi: true,
    testo: 'Di essere consapevole che il personale e il parroco compreso NON possono somministrare medicinali di qualsiasi natura.' },
  { chiave: 'dichiarazione7', soloSi: true,
    testo: 'Di essere consapevole delle sanzioni penali previste in caso di dichiarazioni false e della decadenza dei benefici eventualmente acquisiti (ai sensi degli artt. 75 e 76 del D.P.R. n. 445 del 28/12/2000).' },
];

const AUTORIZZAZIONI: Domanda[] = [
  { chiave: 'autorizzazione1',
    testo: 'Autorizza il/la proprio/a figlio/a a uscire dal Cre-Grest con tutore/soggetto affidatario o altra persona maggiorenne (consegnare documento di riconoscimento delegante, delegati e modulo delega).',
    nota: 'N.B. Il personale si riserva il diritto di controllare il documento della persona delegata che viene a riprendere il bambino e la possibilità di trattenere il bambino in sede qualora i dati della persona non corrispondessero a quelli indicati dal sottoscrittore del presente modulo, a meno che non ci sia un consenso scritto da parte di chi ne esercita la patria potestà.' },
  { chiave: 'autorizzazione2',
    testo: 'Il consenso per l’esecuzione di foto del proprio figlio/a nell’ambito delle attività riguardanti i laboratori e le attività del Cre-Grest, e autorizza l’eventuale pubblicazione in Internet solo ed esclusivamente nel sito ufficiale della parrocchia e/o account social della parrocchia.' },
  { chiave: 'autorizzazione3', soloSi: true,
    testo: 'Il sottoscritto/a autorizza il/la figlio/a a partecipare a tutte le attività indicate nel programma del Cre-Grest, all’interno della sede ed all’esterno di queste aree previa comunicazione ai genitori, comprese le uscite a pagamento a cui ha iscritto il/la proprio/a figlio/a, sollevando la parrocchia e il personale accompagnatore da ogni responsabilità per eventuali incidenti non imputabili a incuria o negligente sorveglianza degli stessi.' },
  { chiave: 'autorizzazione4',
    testo: 'In caso di necessità, a richiedere l’intervento degli operatori dell’Emergenza Sanitaria (ambulanza) e/o accompagnare il/la ragazzo/a presso il Pronto Soccorso (contemporaneamente i responsabili e i loro collaboratori si attiveranno per avvisare almeno un genitore utilizzando il numero di telefono di reperibilità).' },
];

type Risposte = Record<Chiave, boolean | null> & { allergie: string; intolleranze: string; consenso: boolean };

@Component({
  selector: 'app-grest-modulo-autorizzazione',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  styleUrls: ['./grest.scss'],
  template: `
    <p class="sottoscritti">
      Il/I sottoscritto/i: <strong>{{ sottoscritti() }}</strong>,
      genitore/i di <strong>{{ iscritto.nomeFiglio }} {{ iscritto.cognomeFiglio }}</strong>
    </p>

    <form (ngSubmit)="salva(false)">
      <fieldset>
        <legend>Dichiarazioni</legend>
        @for (d of dichiarazioni; track d.chiave) {
          <ng-container *ngTemplateOutlet="domanda; context: { $implicit: d }" />
        }
      </fieldset>

      <fieldset>
        <legend>Autorizzazioni</legend>
        @for (d of autorizzazioni; track d.chiave) {
          <ng-container *ngTemplateOutlet="domanda; context: { $implicit: d }" />
        }
      </fieldset>

      @if (!admin) {
        <label class="check responsabilita">
          <input type="checkbox" name="consenso" [(ngModel)]="r.consenso" />
          <span><strong>Sì.</strong> {{ testoResponsabilita }}</span>
        </label>
      }

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (ok()) { <div class="alert alert-ok">{{ ok() }}</div> }

      <div class="actions">
        <button type="submit" class="btn btn-outline" [disabled]="loading()">Salva</button>
        <button type="button" class="btn btn-primary" (click)="salva(true)" [disabled]="loading()">
          {{ loading() ? 'Attendere…' : 'Salva e scarica il modulo PDF' }}
        </button>
      </div>
    </form>

    <ng-template #domanda let-d>
      <div class="domanda">
        <p>{{ d.testo }}</p>
        <div class="scelte">
          @if (d.soloSi) {
            <label><input type="checkbox" [name]="d.chiave" [(ngModel)]="ra[d.chiave]" /> Sì</label>
          } @else {
            <label><input type="radio" [name]="d.chiave" [value]="true" [(ngModel)]="ra[d.chiave]" /> Sì</label>
            <label><input type="radio" [name]="d.chiave" [value]="false" [(ngModel)]="ra[d.chiave]" /> No</label>
          }
        </div>
        @if (d.dettaglio && ra[d.chiave]) {
          <textarea [name]="d.dettaglio" rows="2" maxlength="1000" [(ngModel)]="ra[d.dettaglio]"
                    [placeholder]="'Specificare ' + d.dettaglio"></textarea>
        }
        @if (d.nota) { <p class="nota">{{ d.nota }}</p> }
      </div>
    </ng-template>
  `,
  styles: [`
    .sottoscritti { margin-top: 0; }
    .responsabilita { background: var(--color-bg-alt); padding: .85rem 1rem; border-radius: var(--radius); }
  `],
})
export class GrestModuloAutorizzazioneComponent implements OnChanges {
  private grest = inject(GrestService);

  @Input({ required: true }) iscritto!: GrestIscritto;
  /** Modalità responsabile Grest: endpoint admin, dichiarazioni di consenso non modificabili. */
  @Input() admin = false;
  @Output() salvato = new EventEmitter<GrestIscritto>();

  readonly dichiarazioni = DICHIARAZIONI;
  readonly autorizzazioni = AUTORIZZAZIONI;
  readonly testoResponsabilita = TESTO_RESPONSABILITA;

  r!: Risposte;
  /** Accesso per chiave dal template (le domande sono dati). */
  get ra(): Record<string, any> {
    return this.r;
  }
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ok = signal('');

  ngOnChanges(): void {
    const a = this.iscritto.autorizzazione;
    const v = (k: Chiave) => (a ? a[k] : null);
    this.r = {
      dichiarazione1: v('dichiarazione1'), dichiarazione2: v('dichiarazione2'),
      dichiarazione3: v('dichiarazione3'), dichiarazione4: v('dichiarazione4'),
      dichiarazione5: v('dichiarazione5'), dichiarazione6: a ? a.dichiarazione6 : false,
      dichiarazione7: a ? a.dichiarazione7 : false,
      autorizzazione1: v('autorizzazione1'), autorizzazione2: v('autorizzazione2'),
      autorizzazione3: a ? a.autorizzazione3 : false, autorizzazione4: v('autorizzazione4'),
      allergie: a?.allergie ?? '', intolleranze: a?.intolleranze ?? '', consenso: a?.consenso ?? false,
    };
  }

  sottoscritti(): string {
    const i = this.iscritto;
    return [`${i.nomePadre} ${i.cognomePadre}`.trim(), `${i.nomeMadre} ${i.cognomeMadre}`.trim()]
      .filter(Boolean).join(' e ');
  }

  private mancanti(): string | null {
    const tutte = [...DICHIARAZIONI, ...AUTORIZZAZIONI];
    const senzaRisposta = tutte.find((d) =>
      d.soloSi ? !this.admin && this.r[d.chiave] !== true : this.r[d.chiave] === null);
    if (senzaRisposta) {
      return senzaRisposta.soloSi
        ? `Confermate con "Sì": «${senzaRisposta.testo.slice(0, 70)}…»`
        : `Rispondete Sì o No a: «${senzaRisposta.testo.slice(0, 70)}…»`;
    }
    if (!this.admin && !this.r.consenso) return 'La dichiarazione di responsabilità genitoriale è obbligatoria.';
    return null;
  }

  salva(scarica: boolean): void {
    const errore = this.mancanti();
    this.ok.set('');
    if (errore) {
      this.error.set(errore);
      return;
    }
    const r = this.r;
    const dati: GrestAutorizzazione = {
      dichiarazione1: !!r.dichiarazione1, dichiarazione2: !!r.dichiarazione2,
      dichiarazione3: !!r.dichiarazione3, dichiarazione4: !!r.dichiarazione4,
      dichiarazione5: !!r.dichiarazione5, dichiarazione6: !!r.dichiarazione6,
      dichiarazione7: !!r.dichiarazione7,
      allergie: r.dichiarazione2 ? r.allergie.trim() : '',
      intolleranze: r.dichiarazione3 ? r.intolleranze.trim() : '',
      autorizzazione1: !!r.autorizzazione1, autorizzazione2: !!r.autorizzazione2,
      autorizzazione3: !!r.autorizzazione3, autorizzazione4: !!r.autorizzazione4,
      consenso: r.consenso,
    };
    this.loading.set(true);
    this.error.set('');
    const { consenso, ...senzaConsenso } = dati;
    const id = this.iscritto._id;
    const salva$ = this.admin ? this.grest.salvaAutorizzazioneAdmin(id, senzaConsenso) : this.grest.salvaAutorizzazione(dati);
    salva$.pipe(
      tap((i) => this.salvato.emit(i)),
      switchMap(() => (!scarica ? of(null)
        : this.admin ? this.grest.scaricaModuloAdmin(id, 'autorizzazione') : this.grest.scaricaModulo('autorizzazione'))),
    ).subscribe({
      next: (pdf) => {
        this.loading.set(false);
        if (pdf) salvaFile(pdf, 'modulo_autorizzazione.pdf');
        this.ok.set(pdf
          ? 'Dati salvati e modulo scaricato: stampatelo, firmatelo e consegnatelo in parrocchia.'
          : 'Modulo di autorizzazione salvato.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Salvataggio non riuscito. Riprovate più tardi.'));
      },
    });
  }
}
