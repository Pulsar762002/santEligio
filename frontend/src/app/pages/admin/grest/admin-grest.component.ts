import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';
import { GrestModuloIscrizioneComponent } from '../../grest/grest-modulo-iscrizione.component';
import { GrestModuloAutorizzazioneComponent } from '../../grest/grest-modulo-autorizzazione.component';
import { GrestModuloDelegaComponent } from '../../grest/grest-modulo-delega.component';
import { GrestService, salvaFile } from '../../../core/services/grest.service';
import { GrestImpostazioni, GrestIscritto, ModuloGrest, messaggioErrore } from '../../../core/models/grest.model';

const siNo = (v: boolean | null | undefined) => (v == null ? '—' : v ? 'Sì' : 'No');

@Component({
  selector: 'app-admin-grest',
  standalone: true,
  imports: [
    RouterLink, DataTableComponent, GrestModuloIscrizioneComponent, GrestModuloAutorizzazioneComponent,
    GrestModuloDelegaComponent,
  ],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">← Pannello</a>
          <h1>Iscritti Grest</h1>
        </div>
        <button class="btn btn-primary" (click)="csv()" [disabled]="!iscritti().length">Esporta CSV</button>
      </div>

      @if (impostazioni(); as imp) {
        <div class="iscrizioni" [class.aperte]="imp.iscrizioniAperte">
          <div>
            <h2>Nuove iscrizioni: {{ imp.iscrizioniAperte ? 'aperte' : 'chiuse' }}</h2>
            <p>
              @if (imp.iscrizioniAperte) {
                Le famiglie possono registrare nuovi bambini dalla pagina del Grest
                ({{ imp.iscritti }} iscritti su {{ imp.maxIscritti }} posti).
              } @else {
                Il tasto "Nuova iscrizione" è nascosto e le registrazioni vengono rifiutate.
                Chi è già iscritto continua ad accedere e a scaricare i moduli.
              }
            </p>
            @if (imp.iscrizioniAperte && imp.iscritti >= imp.maxIscritti) {
              <p class="avviso">Posti esauriti: la registrazione è comunque bloccata dal limite di {{ imp.maxIscritti }}.</p>
            }
          </div>
          <button class="btn" [class.btn-primary]="!imp.iscrizioniAperte" [class.btn-outline]="imp.iscrizioniAperte"
                  (click)="cambiaIscrizioni(!imp.iscrizioniAperte)" [disabled]="salvaImp()">
            {{ imp.iscrizioniAperte ? 'Chiudi le iscrizioni' : 'Apri le iscrizioni' }}
          </button>
        </div>
        <div class="iscrizioni" [class.aperte]="!imp.accessoRistretto">
          <div>
            <h2>Accesso al portale famiglie: {{ imp.accessoRistretto ? 'solo utenti abilitati' : 'tutti' }}</h2>
            <p>
              @if (imp.accessoRistretto) {
                Possono entrare solo le {{ imp.abilitati }} famiglie con "Abilitato" nell'elenco qui sotto;
                le altre vedono il messaggio "portale momentaneamente aperto solo ad alcune famiglie".
              } @else {
                Tutte le famiglie con l'account attivo possono accedere. Con "solo abilitati" entrano solo
                quelle che abiliti dall'elenco ({{ imp.abilitati }} abilitate ora).
              }
            </p>
          </div>
          <button class="btn" [class.btn-primary]="imp.accessoRistretto" [class.btn-outline]="!imp.accessoRistretto"
                  (click)="cambiaAccesso(!imp.accessoRistretto)" [disabled]="salvaImp()">
            {{ imp.accessoRistretto ? 'Apri a tutti' : 'Solo utenti abilitati' }}
          </button>
        </div>
      }

      <div class="numeri">
        <div><strong>{{ iscritti().length }}</strong> iscritti</div>
        <div><strong>{{ conteggi().attivi }}</strong> account attivi</div>
        <div><strong>{{ conteggi().iscrizione }}</strong> iscrizioni compilate</div>
        <div><strong>{{ conteggi().autorizzazione }}</strong> autorizzazioni</div>
        <div><strong>{{ conteggi().delega }}</strong> deleghe</div>
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-info">{{ info() }}</div> }

      <app-data-table
        [columns]="columns"
        [rows]="iscritti()"
        [actions]="azioni"
        [initialSort]="{ key: 'cognome', dir: 'asc' }"
        searchPlaceholder="Cerca per nome, genitore, email, username…"
      />
      <ng-template #azioni let-i>
        <button class="link" (click)="apriDettaglio(i)">Dettaglio</button>
        <button class="link" (click)="pdf(i, 'iscrizione')" [disabled]="!i.consenso">Iscr.</button>
        <button class="link" (click)="pdf(i, 'autorizzazione')" [disabled]="!i.autorizzazione">Aut.</button>
        <button class="link" (click)="pdf(i, 'delega')" [disabled]="!i.delega?.delegati?.length">Del.</button>
        <button class="link" (click)="abilita(i, !i.abilitato)">{{ i.abilitato ? 'Disabilita' : 'Abilita' }}</button>
        <button class="link" (click)="linkPassword(i)">Link password</button>
        <button class="link danger" (click)="elimina(i)">Elimina</button>
      </ng-template>

      @if (dettaglio(); as d) {
        <div class="card dettaglio">
          <div class="dettaglio-head">
            <h2>{{ d.nomeFiglio }} {{ d.cognomeFiglio }} <small>({{ d.username }})</small></h2>
            <button class="link" (click)="chiudiDettaglio()">Chiudi</button>
          </div>
          <div class="modifica">
            <span>Modifica:</span>
            <button class="link" [class.on]="modulo() === 'iscrizione'" (click)="apriModulo('iscrizione')">Iscrizione</button>
            <button class="link" [class.on]="modulo() === 'autorizzazione'" (click)="apriModulo('autorizzazione')"
                    [disabled]="!d.autorizzazione">Autorizzazione</button>
            <button class="link" [class.on]="modulo() === 'delega'" (click)="apriModulo('delega')"
                    [disabled]="!d.delega">Delega</button>
            <small>Le dichiarazioni di consenso restano quelle firmate dalla famiglia.</small>
          </div>
          @switch (modulo()) {
            @case ('iscrizione') {
              <app-grest-modulo-iscrizione [iscritto]="d" [admin]="true" (salvato)="aggiornato($event)" />
            }
            @case ('autorizzazione') {
              <app-grest-modulo-autorizzazione [iscritto]="d" [admin]="true" (salvato)="aggiornato($event)" />
            }
            @case ('delega') {
              <app-grest-modulo-delega [iscritto]="d" [admin]="true" (salvato)="aggiornato($event)" />
            }
          }
          @if (!modulo()) {
          <div class="colonne">
            <section>
              <h3>Iscrizione</h3>
              <dl>
                <dt>Nato/a</dt><dd>{{ d.natoA }} il {{ d.natoIl }}</dd>
                <dt>Residenza</dt><dd>{{ d.residenteA }}, {{ d.via }}</dd>
                <dt>Catechismo</dt><dd>{{ d.annoCatechismo || '—' }}</dd>
                <dt>Classe</dt><dd>{{ d.annoElementari || '—' }}</dd>
                <dt>Taglia</dt><dd>{{ d.taglia || '—' }}</dd>
                <dt>Padre</dt><dd>{{ unisci(d.nomePadre + ' ' + d.cognomePadre, d.emailPadre, d.mobilePhonePadre) }}</dd>
                <dt>Madre</dt><dd>{{ unisci(d.nomeMadre + ' ' + d.cognomeMadre, d.emailMadre, d.mobilePhoneMadre) }}</dd>
                <dt>Altro contatto</dt><dd>{{ unisci(d.altroContatto, d.mobilePhoneAltro) }}</dd>
                <dt>Uscita</dt><dd>{{ siNo(d.uscita1) }}</dd>
                <dt>Note</dt><dd>{{ d.altroDaSegnalare || '—' }}</dd>
              </dl>
            </section>
            <section>
              <h3>Autorizzazione</h3>
              @if (d.autorizzazione; as a) {
                <dl>
                  <dt>Problemi di salute</dt><dd>{{ siNo(a.dichiarazione1) }}</dd>
                  <dt>Allergie</dt><dd>{{ siNo(a.dichiarazione2) }} {{ a.allergie }}</dd>
                  <dt>Intolleranze</dt><dd>{{ siNo(a.dichiarazione3) }} {{ a.intolleranze }}</dd>
                  <dt>L. 104/92</dt><dd>{{ siNo(a.dichiarazione4) }}</dd>
                  <dt>Assistenza individuale</dt><dd>{{ siNo(a.dichiarazione5) }}</dd>
                  <dt>Uscita con delegato</dt><dd>{{ siNo(a.autorizzazione1) }}</dd>
                  <dt>Foto</dt><dd>{{ siNo(a.autorizzazione2) }}</dd>
                  <dt>Emergenza sanitaria</dt><dd>{{ siNo(a.autorizzazione4) }}</dd>
                </dl>
              } @else { <p class="empty">Non compilata.</p> }
              <h3>Delega</h3>
              @if (d.delega?.delegati?.length) {
                <ul>
                  @for (x of d.delega!.delegati; track $index) {
                    <li>{{ x.nome }} {{ x.cognome }} — {{ x.tipoDocumento }} {{ x.numeroDocumento }}</li>
                  }
                </ul>
              } @else { <p class="empty">Non compilata.</p> }
            </section>
          </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .iscrizioni {
      display: flex; justify-content: space-between; align-items: center; gap: 1rem 1.5rem; flex-wrap: wrap;
      background: white; border: 1px solid var(--color-border); border-left: 5px solid #b91c1c;
      border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    }
    .iscrizioni.aperte { border-left-color: #166534; }
    .iscrizioni h2 { margin: 0 0 .25rem; font-size: 1.1rem; }
    .iscrizioni p { margin: 0; font-size: .9rem; color: var(--color-text-muted); max-width: 680px; }
    .iscrizioni .avviso { color: #b45309; margin-top: .35rem; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
    .numeri { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1.25rem; }
    .numeri div { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: .5rem .9rem; font-size: .9rem; }
    .numeri strong { color: var(--color-primary-dark); font-size: 1.1rem; }
    .alert-info { background: var(--color-bg-alt); border: 1px solid var(--color-border); word-break: break-all; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .35rem; font-size: .85rem; }
    .link:hover:not([disabled]) { text-decoration: underline; }
    .link[disabled] { color: var(--color-text-muted); opacity: .5; cursor: default; }
    .link.danger { color: #b91c1c; }
    .dettaglio { margin-top: 1.5rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.5rem; }
    .modifica { display: flex; gap: .25rem .5rem; align-items: center; flex-wrap: wrap; margin: -.25rem 0 1.25rem;
                padding-bottom: .75rem; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .modifica .on { font-weight: 700; text-decoration: underline; }
    .modifica small { color: var(--color-text-muted); flex-basis: 100%; }
    .dettaglio-head { display: flex; justify-content: space-between; align-items: baseline; }
    .dettaglio h2 { margin: 0 0 1rem; font-size: 1.2rem; }
    .dettaglio h2 small { color: var(--color-text-muted); font-weight: 400; }
    .dettaglio h3 { font-size: 1rem; color: var(--color-primary-dark); margin: .5rem 0; }
    .colonne { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 760px) { .colonne { grid-template-columns: 1fr; } }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: .25rem .75rem; margin: 0 0 1rem; font-size: .9rem; }
    dt { color: var(--color-text-muted); }
    dd { margin: 0; }
  `],
})
export class AdminGrestComponent {
  private grest = inject(GrestService);

  readonly iscritti = signal<GrestIscritto[]>([]);
  readonly dettaglio = signal<GrestIscritto | null>(null);
  readonly impostazioni = signal<GrestImpostazioni | null>(null);
  readonly salvaImp = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly siNo = siNo;
  readonly unisci = (...parti: string[]) => parti.map((p) => (p ?? '').trim()).filter(Boolean).join(' · ') || '—';

  readonly conteggi = computed(() => {
    const l = this.iscritti();
    return {
      attivi: l.filter((i) => i.attivo).length,
      iscrizione: l.filter((i) => i.consenso).length,
      autorizzazione: l.filter((i) => i.autorizzazione).length,
      delega: l.filter((i) => i.delega?.delegati?.length).length,
    };
  });

  readonly columns: ColumnDef<GrestIscritto>[] = [
    { key: 'cognome', label: 'Bambino/a', value: (i) => `${i.cognomeFiglio} ${i.nomeFiglio}`,
      display: (i) => `${i.nomeFiglio} ${i.cognomeFiglio}` },
    { key: 'catechismo', label: 'Catechismo', value: (i) => i.annoCatechismo },
    { key: 'genitori', label: 'Genitori', sortable: false,
      value: (i) => [i.nomePadre, i.cognomePadre, i.nomeMadre, i.cognomeMadre, i.emailPadre, i.emailMadre, i.username].join(' '),
      display: (i) => [`${i.nomePadre} ${i.cognomePadre}`.trim(), `${i.nomeMadre} ${i.cognomeMadre}`.trim()].filter(Boolean).join(' / ') },
    { key: 'telefoni', label: 'Telefoni', sortable: false,
      value: (i) => [i.mobilePhonePadre, i.mobilePhoneMadre].filter(Boolean).join(' ') },
    { key: 'moduli', label: 'Moduli', filterable: false,
      value: (i) => Number(!!i.consenso) + Number(!!i.autorizzazione) + Number(!!i.delega?.delegati?.length),
      display: (i) => `${i.consenso ? 'I' : '–'} ${i.autorizzazione ? 'A' : '–'} ${i.delega?.delegati?.length ? 'D' : '–'}` },
    { key: 'abilitato', label: 'Abilitato', type: 'badge', value: (i) => !!i.abilitato,
      badgeLabel: (i) => (i.abilitato ? 'Sì' : 'No'), badgeOn: (i) => !!i.abilitato },
    { key: 'attivo', label: 'Account', type: 'badge', value: (i) => i.attivo,
      badgeLabel: (i) => (i.attivo ? 'Attivo' : 'Da attivare'), badgeOn: (i) => i.attivo },
  ];

  constructor() {
    this.ricarica();
  }

  cambiaIscrizioni(aperte: boolean): void {
    const msg = aperte
      ? 'Aprire le nuove iscrizioni? Il tasto "Nuova iscrizione" tornerà visibile sul sito.'
      : 'Chiudere le nuove iscrizioni? Il tasto "Nuova iscrizione" sparirà dal sito.';
    if (!confirm(msg)) return;
    this.salvaImp.set(true);
    this.error.set('');
    this.salva({ iscrizioniAperte: aperte });
  }

  cambiaAccesso(ristretto: boolean): void {
    const msg = ristretto
      ? `Limitare l'accesso al portale alle sole famiglie abilitate (${this.impostazioni()?.abilitati ?? 0})? Le altre verranno disconnesse.`
      : 'Riaprire il portale a tutte le famiglie?';
    if (!confirm(msg)) return;
    this.salva({ accessoRistretto: ristretto });
  }

  private salva(imp: { iscrizioniAperte?: boolean; accessoRistretto?: boolean }): void {
    this.salvaImp.set(true);
    this.error.set('');
    this.grest.salvaImpostazioni(imp).subscribe({
      next: (imp) => {
        this.impostazioni.set(imp);
        this.salvaImp.set(false);
      },
      error: () => {
        this.salvaImp.set(false);
        this.error.set('Impossibile salvare l\'impostazione.');
      },
    });
  }

  readonly modulo = signal<ModuloGrest | null>(null);

  apriModulo(m: ModuloGrest): void {
    this.modulo.set(this.modulo() === m ? null : m);
  }

  apriDettaglio(i: GrestIscritto): void {
    this.dettaglio.set(this.dettaglio()?._id === i._id ? null : i);
    this.modulo.set(null);
  }

  chiudiDettaglio(): void {
    this.dettaglio.set(null);
    this.modulo.set(null);
  }

  /** Dopo una modifica del responsabile: aggiorna dettaglio ed elenco senza ricaricare tutto. */
  aggiornato(i: GrestIscritto): void {
    if (this.dettaglio()?._id === i._id) this.dettaglio.set(i);
    this.iscritti.update((l) => l.map((x) => (x._id === i._id ? i : x)));
  }

  abilita(i: GrestIscritto, abilitato: boolean): void {
    this.error.set('');
    this.grest.impostaAbilitato(i._id, abilitato).subscribe({
      next: (agg) => {
        this.aggiornato(agg);
        this.impostazioni.update((imp) => imp && { ...imp, abilitati: imp.abilitati + (abilitato ? 1 : -1) });
      },
      error: () => this.error.set('Operazione non riuscita.'),
    });
  }

  private ricarica(): void {
    this.grest.impostazioni().subscribe({
      next: (imp) => this.impostazioni.set(imp),
      error: () => this.error.set('Impossibile leggere lo stato delle iscrizioni.'),
    });
    this.grest.elenco().subscribe({
      next: (l) => this.iscritti.set(l),
      error: () => this.error.set('Impossibile caricare gli iscritti.'),
    });
  }

  csv(): void {
    this.grest.esportaCsv().subscribe({
      next: (b) => salvaFile(b, 'iscritti-grest.csv'),
      error: () => this.error.set('Esportazione non riuscita.'),
    });
  }

  pdf(i: GrestIscritto, modulo: ModuloGrest): void {
    this.error.set('');
    this.grest.scaricaModuloAdmin(i._id, modulo).subscribe({
      next: (b) => salvaFile(b, `${modulo}_${i.cognomeFiglio}_${i.nomeFiglio}.pdf`),
      error: () => this.error.set(`Generazione del modulo di ${modulo} non riuscita.`),
    });
  }

  linkPassword(i: GrestIscritto): void {
    const cosa = i.attivo ? 'reimpostare la password' : "attivare l'account";
    if (!confirm(`Inviare alle email di ${i.nomeFiglio} ${i.cognomeFiglio} un link per ${cosa}?`)) return;
    this.error.set('');
    this.info.set('');
    this.grest.linkPassword(i._id).subscribe({
      next: (r) => this.info.set(r.inviata
        ? `Email inviata a ${r.destinatari.join(', ')}. Link (valido una volta): ${r.link}`
        : `Email NON inviata (SMTP non disponibile). Potete inoltrare voi il link: ${r.link}`),
      error: (err) => this.error.set(messaggioErrore(err, 'Invio del link non riuscito.')),
    });
  }

  elimina(i: GrestIscritto): void {
    if (!confirm(`Eliminare definitivamente ${i.nomeFiglio} ${i.cognomeFiglio} e tutti i suoi moduli?`)) return;
    this.grest.elimina(i._id).subscribe({
      next: () => {
        if (this.dettaglio()?._id === i._id) this.dettaglio.set(null);
        this.ricarica();
      },
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
