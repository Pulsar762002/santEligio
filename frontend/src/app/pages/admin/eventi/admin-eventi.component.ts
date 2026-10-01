import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AreeService } from '../../../core/services/aree.service';
import { AuthService } from '../../../core/services/auth.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { Evento } from '../../../core/models/evento.model';
import { AreaPortale } from '../../../core/models/utente.model';
import { Esito } from '../../../core/models/area.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';
import { isoToLocalInput, localInputToIso } from '../../../core/utils/date-input';
import { EditorTestoComponent } from '../../../shared/editor-testo/editor-testo.component';

interface EventoForm {
  titolo: string;
  descrizione: string;
  dataInizio: string; // datetime-local: YYYY-MM-DDTHH:mm
  dataFine: string;
  luogo: string;
  immagine: string;
  pubblicato: boolean;
  aree: string[];
}

function emptyForm(aree: string[] = []): EventoForm {
  return { titolo: '', descrizione: '', dataInizio: '', dataFine: '', luogo: '', immagine: '', pubblicato: false, aree };
}

// Eventi per Admin (tutti), Responsabili e Contributor (quelli delle proprie aree).
// Ogni evento può appartenere a una o più aree; gli eventi storici non ne hanno.
@Component({
  selector: 'app-admin-eventi',
  standalone: true,
  imports: [RouterLink, FormsModule, DataTableComponent, EditorTestoComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Eventi</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()" [disabled]="!auth.isAdmin() && !areeSelezionabili().length">
            + Nuovo evento
          </button>
        }
      </div>

      @if (contributor()) {
        <div class="alert alert-info">
          Sei <strong>Contributor</strong>: i nuovi eventi e le modifiche vengono inviati al responsabile
          dell'area e compaiono sul sito dopo l'approvazione (<a routerLink="/admin/approvazioni">Le mie proposte</a>).
        </div>
      }
      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-ok">{{ info() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica evento' : 'Nuovo evento' }}</h2>

          <div class="form-group">
            <label for="titolo">Titolo *</label>
            <input id="titolo" name="titolo" [(ngModel)]="form.titolo" required maxlength="200" />
          </div>

          <div class="form-group">
            <label>Aree {{ auth.isAdmin() ? '' : '*' }}</label>
            <span class="hint">
              @if (auth.isAdmin()) {
                Le realtà che organizzano l'evento (facoltativo): i loro responsabili potranno gestirlo.
              } @else {
                Scegli almeno una delle tue aree.
              }
            </span>
            <div class="chips">
              @for (a of areeSelezionabili(); track a.chiave) {
                <label class="chip" [class.on]="form.aree.includes(a.chiave)">
                  <input type="checkbox" [checked]="form.aree.includes(a.chiave)" (change)="toggleArea(a.chiave)" />
                  {{ a.nome }}
                </label>
              }
            </div>
            @if (areeAltrui().length) {
              <span class="hint">Condiviso anche con: <strong>{{ areeAltrui().join(', ') }}</strong> (non modificabili da te).</span>
            }
          </div>

          <div class="row">
            <div class="form-group">
              <label for="dataInizio">Data e ora inizio *</label>
              <input id="dataInizio" name="dataInizio" type="datetime-local" [(ngModel)]="form.dataInizio" required />
            </div>
            <div class="form-group">
              <label for="dataFine">Data e ora fine</label>
              <input id="dataFine" name="dataFine" type="datetime-local" [(ngModel)]="form.dataFine" />
            </div>
          </div>

          <div class="form-group">
            <label for="luogo">Luogo</label>
            <input id="luogo" name="luogo" [(ngModel)]="form.luogo" />
          </div>

          <div class="form-group">
            <label>Immagine</label>
            @if (form.immagine) {
              <div class="img-preview">
                <img [src]="src(form.immagine)" alt="Anteprima" />
                <button type="button" class="link danger" (click)="form.immagine = ''">Rimuovi</button>
              </div>
            }
            <input type="file" accept="image/png,image/jpeg,image/webp" (change)="caricaImmagine($event)" [disabled]="uploading()" />
            @if (uploading()) { <span class="hint">Caricamento immagine…</span> }
            <span class="hint">PNG, JPG o WebP — max 10 MB.</span>
          </div>

          <div class="form-group">
            <label>Descrizione</label>
            <app-editor-testo name="descrizione" [(ngModel)]="form.descrizione" [html]="auth.isAdmin()" />
          </div>

          <label class="check">
            <input type="checkbox" name="pubblicato" [(ngModel)]="form.pubblicato" />
            Pubblicato (visibile sul sito)
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : contributor() ? 'Invia in approvazione' : 'Salva' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="annulla()" [disabled]="saving()">Annulla</button>
          </div>
        </form>
      } @else {
        <div class="filtro">
          <label for="filtroArea">Area</label>
          <select id="filtroArea" [ngModel]="filtroArea()" (ngModelChange)="filtra($event)">
            <option value="">{{ auth.isAdmin() ? 'Tutti gli eventi' : 'Tutte le mie aree' }}</option>
            @if (auth.isAdmin()) { <option value="__nessuna">Senza area</option> }
            @for (a of areeSelezionabili(); track a.chiave) { <option [value]="a.chiave">{{ a.nome }}</option> }
          </select>
        </div>
        <app-data-table
          [columns]="columns"
          [rows]="visibili()"
          [actions]="azioni"
          [initialSort]="{ key: 'dataInizio', dir: 'desc' }"
          searchPlaceholder="Cerca eventi…"
        />
        <ng-template #azioni let-e>
          <button class="link" (click)="modifica(e)">Modifica</button>
          @if (puoEliminare(e)) {
            <button class="link danger" (click)="elimina(e)">Elimina</button>
          }
        </ng-template>
      }
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.75rem; }
    .form h2 { margin-top: 0; font-size: 1.2rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin: .1rem 0 .4rem; }
    .chips { display: flex; flex-wrap: wrap; gap: .4rem; }
    .chip { display: inline-flex !important; align-items: center; gap: .35rem; font-weight: 400 !important; font-size: .85rem !important;
            border: 1px solid var(--color-border); border-radius: 999px; padding: .25rem .7rem; cursor: pointer; background: white; margin: 0 !important; }
    .chip input { width: auto !important; margin: 0; }
    .chip.on { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .filtro { display: flex; align-items: center; gap: .6rem; margin-bottom: 1rem; }
    .filtro label { font-weight: 600; font-size: .9rem; }
    .filtro select { padding: .4rem .6rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: white; }
    .alert-ok { background: #e7f6ec; color: #166534; border: 1px solid #86efac; }
    .alert-info { background: var(--color-bg-alt); border: 1px solid var(--color-border); }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
  `],
})
export class AdminEventiComponent {
  private service = inject(AreeService);
  private uploads = inject(UploadsService);
  private router = inject(Router);
  protected auth = inject(AuthService);

  readonly eventi = signal<Evento[]>([]);
  readonly tutteLeAree = signal<AreaPortale[]>([]);
  readonly filtroArea = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('area') ?? '');
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  /** Aree dell'evento in modifica che appartengono ad altri (solo informative). */
  readonly areeAltrui = signal<string[]>([]);
  readonly contributor = computed(() => this.auth.ruolo() === 'contributor');

  form: EventoForm = emptyForm();
  src = assetUrl;
  private dp = new DatePipe('it');

  /** Aree che l'utente può assegnare: tutte (admin) o le proprie; mai il Grest. */
  readonly areeSelezionabili = computed(() => {
    const mie = this.auth.aree();
    return this.tutteLeAree().filter((a) => a.tipo !== 'grest' && (this.auth.isAdmin() || mie.includes(a.chiave)));
  });

  readonly visibili = computed(() => {
    const f = this.filtroArea();
    if (!f) return this.eventi();
    if (f === '__nessuna') return this.eventi().filter((e) => !e.aree?.length);
    return this.eventi().filter((e) => e.aree?.includes(f));
  });

  private nomeArea = (k: string) => this.tutteLeAree().find((a) => a.chiave === k)?.nome ?? k;

  readonly columns: ColumnDef<Evento>[] = [
    { key: 'immagine', label: '', type: 'image', sortable: false, filterable: false, width: '64px',
      imageUrl: e => (e.immagine ? this.src(e.immagine) : '') },
    { key: 'titolo', label: 'Titolo', value: e => e.titolo },
    { key: 'dataInizio', label: 'Inizio', type: 'date',
      value: e => (e.dataInizio ? new Date(e.dataInizio).getTime() : 0),
      display: e => this.dp.transform(e.dataInizio, 'd MMM yyyy, HH:mm') ?? '' },
    { key: 'aree', label: 'Aree', sortable: false,
      value: e => (e.aree ?? []).map(this.nomeArea).join(', '),
      display: e => (e.aree?.length ? e.aree.map(this.nomeArea).join(', ') : '—') },
    { key: 'luogo', label: 'Luogo', value: e => e.luogo ?? '', display: e => e.luogo || '—' },
    { key: 'pubblicato', label: 'Stato', type: 'badge', value: e => e.pubblicato,
      badgeLabel: e => (e.pubblicato ? 'Pubblicato' : 'Bozza'), badgeOn: e => e.pubblicato },
  ];

  constructor() {
    this.service.elenco().subscribe((a) => this.tutteLeAree.set(a));
    this.ricarica();
  }

  private ricarica(): void {
    this.service.eventi().subscribe({
      next: list => this.eventi.set(list),
      error: () => this.error.set('Impossibile caricare gli eventi.'),
    });
  }

  filtra(area: string): void {
    this.filtroArea.set(area);
    this.router.navigate([], { queryParams: { area: area || null }, replaceUrl: true });
  }

  puoEliminare(e: Evento): boolean {
    if (this.auth.isAdmin()) return true;
    const aree = e.aree ?? [];
    return this.auth.ruolo() === 'responsabile' && aree.length > 0 && aree.every((a) => this.auth.aree().includes(a));
  }

  toggleArea(k: string): void {
    const a = this.form.aree;
    this.form.aree = a.includes(k) ? a.filter((x) => x !== k) : [...a, k];
  }

  nuovo(): void {
    // area del filtro (es. arrivando da "Le mie aree") già selezionata
    const f = this.filtroArea();
    const preselezione = f && this.areeSelezionabili().some((a) => a.chiave === f) ? [f] : [];
    this.form = emptyForm(preselezione);
    this.areeAltrui.set([]);
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
    this.info.set('');
  }

  modifica(e: Evento): void {
    const mie = this.areeSelezionabili().map((a) => a.chiave);
    const aree = e.aree ?? [];
    this.form = {
      titolo: e.titolo,
      descrizione: e.descrizione ?? '',
      dataInizio: isoToLocalInput(e.dataInizio),
      dataFine: isoToLocalInput(e.dataFine),
      luogo: e.luogo ?? '',
      immagine: e.immagine ?? '',
      pubblicato: e.pubblicato,
      aree: aree.filter((a) => this.auth.isAdmin() || mie.includes(a)),
    };
    this.areeAltrui.set(this.auth.isAdmin() ? [] : aree.filter((a) => !mie.includes(a)).map(this.nomeArea));
    this.editId.set(e._id);
    this.editing.set(true);
    this.error.set('');
    this.info.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  caricaImmagine(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.uploads.upload(file).subscribe({
      next: ({ url }) => {
        this.form.immagine = url;
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.uploading.set(false);
        this.error.set('Caricamento immagine non riuscito.');
        input.value = '';
      },
    });
  }

  salva(): void {
    this.error.set('');
    if (!this.form.titolo.trim()) return this.error.set('Il titolo è obbligatorio.');
    if (!this.form.dataInizio) return this.error.set('La data e ora di inizio sono obbligatorie.');
    if (!this.auth.isAdmin() && !this.form.aree.length && !this.areeAltrui().length) {
      return this.error.set('Scegli almeno una delle tue aree.');
    }

    const payload: Partial<Evento> = {
      titolo: this.form.titolo.trim(),
      descrizione: this.form.descrizione.trim() || undefined,
      dataInizio: localInputToIso(this.form.dataInizio),
      dataFine: this.form.dataFine ? localInputToIso(this.form.dataFine) : undefined,
      luogo: this.form.luogo.trim() || undefined,
      immagine: this.form.immagine,
      pubblicato: this.form.pubblicato,
      // per i non-admin si inviano solo le proprie aree: quelle degli altri le conserva il server
      aree: this.form.aree,
    };

    this.saving.set(true);
    const id = this.editId();
    const req = id ? this.service.modificaEvento(id, payload) : this.service.creaEvento(payload);
    req.subscribe({
      next: (esito: Esito<Evento>) => {
        this.saving.set(false);
        this.editing.set(false);
        this.info.set(esito.inAttesa
          ? 'Inviato in approvazione: comparirà sul sito quando il responsabile lo approverà.'
          : id ? 'Evento aggiornato.' : 'Evento creato.');
        this.ricarica();
      },
      error: (err) => {
        this.saving.set(false);
        const dettaglio = err?.error?.message;
        const msg = Array.isArray(dettaglio) ? dettaglio.join(', ') : dettaglio;
        this.error.set(msg ? `Salvataggio non riuscito: ${msg}` : 'Salvataggio non riuscito. Controlla i campi e riprova.');
      },
    });
  }

  elimina(e: Evento): void {
    if (!confirm(`Eliminare l'evento "${e.titolo}"?`)) return;
    this.service.eliminaEvento(e._id).subscribe({
      next: () => this.ricarica(),
      error: (err) => this.error.set(err?.error?.message ?? 'Eliminazione non riuscita.'),
    });
  }
}
