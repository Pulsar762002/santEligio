import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of, switchMap, tap } from 'rxjs';
import { GrestService, salvaFile } from '../../core/services/grest.service';
import {
  GrestDelegato, GrestIscritto, NOTA_CONSEGNA_DELEGA, TESTO_RESPONSABILITA, TIPI_DOCUMENTO,
  messaggioErrore,
} from '../../core/models/grest.model';

const MAX_DELEGATI = 4;
const vuoto = (): GrestDelegato => ({ nome: '', cognome: '', tipoDocumento: '', numeroDocumento: '' });

@Component({
  selector: 'app-grest-modulo-delega',
  standalone: true,
  imports: [FormsModule],
  styleUrls: ['./grest.scss'],
  template: `
    <p class="sottoscritti">
      Il/I sottoscritto/i: <strong>{{ sottoscritti() }}</strong> delegano al ritiro di
      <strong>{{ iscritto.nomeFiglio }} {{ iscritto.cognomeFiglio }}</strong> le seguenti persone maggiorenni:
    </p>

    <form (ngSubmit)="salva(false)" #f="ngForm">
      @for (d of delegati; track d; let n = $index) {
        <fieldset>
          <legend>Delegato {{ n + 1 }}</legend>
          <div class="row-4">
            <div class="form-group">
              <label [for]="'nome' + n" class="req">Nome</label>
              <input [id]="'nome' + n" [name]="'nome' + n" [(ngModel)]="d.nome" required maxlength="80" />
            </div>
            <div class="form-group">
              <label [for]="'cognome' + n" class="req">Cognome</label>
              <input [id]="'cognome' + n" [name]="'cognome' + n" [(ngModel)]="d.cognome" required maxlength="80" />
            </div>
            <div class="form-group">
              <label [for]="'tipo' + n" class="req">Documento</label>
              <select [id]="'tipo' + n" [name]="'tipo' + n" [(ngModel)]="d.tipoDocumento" required>
                <option value="" disabled>Tipo documento</option>
                @for (t of tipi; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label [for]="'numero' + n" class="req">Numero documento</label>
              <input [id]="'numero' + n" [name]="'numero' + n" [(ngModel)]="d.numeroDocumento" required maxlength="40" />
            </div>
          </div>
          @if (delegati.length > 1) {
            <button type="button" class="link danger" (click)="rimuovi(n)">Rimuovi delegato</button>
          }
        </fieldset>
      }
      @if (delegati.length < max) {
        <button type="button" class="btn btn-outline aggiungi" (click)="aggiungi()">+ Aggiungi un delegato</button>
      }

      <div class="alert alert-info">{{ notaConsegna }}</div>

      @if (!admin) {
        <label class="check responsabilita">
          <input type="checkbox" name="consenso" [(ngModel)]="consenso" />
          <span><strong>Sì.</strong> {{ testoResponsabilita }}</span>
        </label>
      }

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (ok()) { <div class="alert alert-ok">{{ ok() }}</div> }

      <div class="actions">
        <button type="submit" class="btn btn-outline" [disabled]="loading() || !f.valid || (!admin && !consenso)">Salva</button>
        <button type="button" class="btn btn-primary" (click)="salva(true)"
                [disabled]="loading() || !f.valid || (!admin && !consenso)">
          {{ loading() ? 'Attendere…' : 'Salva e scarica il modulo PDF' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .sottoscritti { margin-top: 0; }
    .aggiungi { margin-bottom: 1.25rem; }
    .responsabilita { background: var(--color-bg-alt); padding: .85rem 1rem; border-radius: var(--radius); }
    .link { background: none; border: none; cursor: pointer; padding: 0 0 .75rem; font-size: .85rem; }
    .link.danger { color: #b91c1c; }
  `],
})
export class GrestModuloDelegaComponent implements OnChanges {
  private grest = inject(GrestService);

  @Input({ required: true }) iscritto!: GrestIscritto;
  /** Modalità responsabile Grest: endpoint admin, dichiarazioni di consenso non modificabili. */
  @Input() admin = false;
  @Output() salvato = new EventEmitter<GrestIscritto>();

  readonly tipi = TIPI_DOCUMENTO;
  readonly max = MAX_DELEGATI;
  readonly notaConsegna = NOTA_CONSEGNA_DELEGA;
  readonly testoResponsabilita = TESTO_RESPONSABILITA;

  delegati: GrestDelegato[] = [vuoto()];
  consenso = false;
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ok = signal('');

  ngOnChanges(): void {
    const d = this.iscritto.delega;
    this.delegati = d?.delegati?.length ? d.delegati.map((x) => ({ ...x })) : [vuoto()];
    this.consenso = d?.consenso ?? false;
  }

  sottoscritti(): string {
    const i = this.iscritto;
    return [`${i.nomePadre} ${i.cognomePadre}`.trim(), `${i.nomeMadre} ${i.cognomeMadre}`.trim()]
      .filter(Boolean).join(' e ');
  }

  aggiungi(): void {
    if (this.delegati.length < MAX_DELEGATI) this.delegati.push(vuoto());
  }

  rimuovi(n: number): void {
    this.delegati.splice(n, 1);
  }

  salva(scarica: boolean): void {
    this.loading.set(true);
    this.error.set('');
    this.ok.set('');
    const id = this.iscritto._id;
    const salva$ = this.admin
      ? this.grest.salvaDelegaAdmin(id, { delegati: this.delegati })
      : this.grest.salvaDelega({ delegati: this.delegati, consenso: this.consenso });
    salva$.pipe(
      tap((i) => this.salvato.emit(i)),
      switchMap(() => (!scarica ? of(null)
        : this.admin ? this.grest.scaricaModuloAdmin(id, 'delega') : this.grest.scaricaModulo('delega'))),
    ).subscribe({
      next: (pdf) => {
        this.loading.set(false);
        if (pdf) salvaFile(pdf, 'modulo_delega.pdf');
        this.ok.set(pdf
          ? 'Dati salvati e modulo scaricato: stampatelo, firmatelo e consegnatelo in parrocchia.'
          : 'Modulo di delega salvato.');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(messaggioErrore(err, 'Salvataggio non riuscito. Controllate i campi e riprovate.'));
      },
    });
  }
}
