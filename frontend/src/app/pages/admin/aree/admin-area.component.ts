import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AreeService } from '../../../core/services/aree.service';
import { AuthService } from '../../../core/services/auth.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { ContenutoArea, Esito, EventoArea } from '../../../core/models/area.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { isoToLocalInput, localInputToIso } from '../../../core/utils/date-input';
import { EditorTestoComponent } from '../../../shared/editor-testo/editor-testo.component';

interface FormEvento {
  titolo: string;
  dataInizio: string;
  dataFine: string;
  luogo: string;
  immagine: string;
  descrizione: string;
  pubblicato: boolean;
}

const eventoVuoto = (): FormEvento => ({
  titolo: '', dataInizio: '', dataFine: '', luogo: '', immagine: '', descrizione: '', pubblicato: true,
});

function errore(err: any, fallback: string): string {
  const m = err?.error?.message;
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' && m ? m : fallback;
}

@Component({
  selector: 'app-admin-area',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, EditorTestoComponent],
  template: `
    <div class="container page-content">
      <a routerLink="/admin/aree" class="back">← {{ auth.isAdmin() ? 'Aree' : 'Le mie aree' }}</a>
      <h1>{{ nomeArea() }}</h1>

      @if (contributor()) {
        <div class="alert alert-info">
          Sei <strong>Contributor</strong>: quello che salvi viene inviato al responsabile dell'area e
          compare sul sito solo dopo la sua approvazione. Stato delle tue proposte in
          <a routerLink="/admin/approvazioni">Le mie proposte</a>.
        </div>
      }
      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-ok">{{ info() }}</div> }

      <div class="tabs">
        <button [class.on]="tab() === 'pagina'" (click)="tab.set('pagina')">Pagina</button>
        <button [class.on]="tab() === 'eventi'" (click)="tab.set('eventi')">Eventi ({{ eventi().length }})</button>
      </div>

      @if (tab() === 'pagina') {
        @if (!contenuto) {
          <p class="empty">Caricamento…</p>
        } @else {
          <form class="card" (ngSubmit)="salvaContenuto()" #fc="ngForm">
            @if (!contenuto.esiste) {
              <p class="hint">La pagina non esiste ancora: verrà creata e collegata alla voce del menu al primo salvataggio.</p>
            }
            <div class="form-group">
              <label for="titolo">Titolo *</label>
              <input id="titolo" name="titolo" [(ngModel)]="contenuto.titolo" required maxlength="200" />
            </div>
            <div class="form-group">
              <label for="sottotitolo">Sottotitolo</label>
              <input id="sottotitolo" name="sottotitolo" [(ngModel)]="contenuto.sottotitolo" maxlength="300" />
            </div>
            <div class="form-group">
              <label>Immagine</label>
              @if (contenuto.immagine) {
                <div class="img-preview">
                  <img [src]="src(contenuto.immagine)" alt="Anteprima" />
                  <button type="button" class="link danger" (click)="contenuto.immagine = ''">Rimuovi</button>
                </div>
              }
              <input type="file" accept="image/*" (change)="carica($event, 'pagina')" [disabled]="uploading()" />
            </div>
            <div class="form-group">
              <label>Testo della pagina *</label>
              <app-editor-testo name="contenuto" [(ngModel)]="contenuto.contenuto" required [html]="auth.isAdmin()" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="saving() || !fc.valid">
                {{ saving() ? 'Salvataggio…' : contributor() ? 'Invia in approvazione' : 'Pubblica' }}
              </button>
            </div>
          </form>
        }
      } @else {
        @if (editingEvento()) {
          <form class="card" (ngSubmit)="salvaEvento()" #fe="ngForm">
            <h2>{{ eventoId() ? 'Modifica evento' : 'Nuovo evento' }}</h2>
            <div class="form-group">
              <label for="etitolo">Titolo *</label>
              <input id="etitolo" name="titolo" [(ngModel)]="evento.titolo" required maxlength="200" />
            </div>
            <div class="row-2">
              <div class="form-group">
                <label for="inizio">Inizio *</label>
                <input id="inizio" name="dataInizio" type="datetime-local" [(ngModel)]="evento.dataInizio" required />
              </div>
              <div class="form-group">
                <label for="fine">Fine</label>
                <input id="fine" name="dataFine" type="datetime-local" [(ngModel)]="evento.dataFine" />
              </div>
            </div>
            <div class="form-group">
              <label for="luogo">Luogo</label>
              <input id="luogo" name="luogo" [(ngModel)]="evento.luogo" />
            </div>
            <div class="form-group">
              <label>Immagine</label>
              @if (evento.immagine) {
                <div class="img-preview">
                  <img [src]="src(evento.immagine)" alt="Anteprima" />
                  <button type="button" class="link danger" (click)="evento.immagine = ''">Rimuovi</button>
                </div>
              }
              <input type="file" accept="image/*" (change)="carica($event, 'evento')" [disabled]="uploading()" />
            </div>
            <div class="form-group">
              <label for="descrizione">Descrizione</label>
              <app-editor-testo name="descrizione" [(ngModel)]="evento.descrizione" [html]="auth.isAdmin()" />
            </div>
            <label class="check">
              <input type="checkbox" name="pubblicato" [(ngModel)]="evento.pubblicato" /> Visibile sul sito
            </label>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="saving() || !fe.valid">
                {{ saving() ? 'Salvataggio…' : contributor() ? 'Invia in approvazione' : 'Salva' }}
              </button>
              <button type="button" class="btn btn-outline" (click)="editingEvento.set(false)">Annulla</button>
            </div>
          </form>
        } @else {
          <div class="barra">
            <button class="btn btn-primary" (click)="nuovoEvento()">+ Nuovo evento</button>
          </div>
          @if (!eventi().length) {
            <p class="empty">Nessun evento per quest'area.</p>
          }
          <ul class="eventi">
            @for (e of eventi(); track e._id) {
              <li>
                <div>
                  <strong>{{ e.titolo }}</strong>
                  <span class="data">{{ e.dataInizio | date: 'EEE d MMM yyyy, HH:mm' }}</span>
                  @if (!e.pubblicato) { <span class="bozza">Non visibile</span> }
                </div>
                <div class="azioni">
                  <button class="link" (click)="modificaEvento(e)">Modifica</button>
                  @if (!contributor()) {
                    <button class="link danger" (click)="eliminaEvento(e)">Elimina</button>
                  }
                </div>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    h1 { margin: 0 0 1rem; }
    .tabs { display: flex; gap: .5rem; border-bottom: 1px solid var(--color-border); margin-bottom: 1.25rem; }
    .tabs button { background: none; border: none; border-bottom: 3px solid transparent; padding: .6rem 1rem;
                   font: inherit; font-weight: 600; color: var(--color-text-muted); cursor: pointer; }
    .tabs button.on { color: var(--color-primary-dark); border-bottom-color: var(--color-secondary); }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.5rem; }
    .card h2 { margin-top: 0; font-size: 1.2rem; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
    @media (max-width: 640px) { .row-2 { grid-template-columns: 1fr; } }
    textarea { resize: vertical; }
    .hint { font-size: .85rem; color: #b45309; margin-top: 0; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .alert-ok { background: #e7f6ec; color: #166534; border: 1px solid #86efac; }
    .alert-info { background: var(--color-bg-alt); border: 1px solid var(--color-border); }
    .barra { margin-bottom: 1rem; }
    .eventi { list-style: none; padding: 0; margin: 0; }
    .eventi li { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;
                 background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: .75rem 1rem; margin-bottom: .5rem; }
    .data { display: block; font-size: .85rem; color: var(--color-text-muted); }
    .bozza { font-size: .75rem; background: var(--color-bg-alt); border-radius: 999px; padding: .05rem .5rem; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link.danger { color: #b91c1c; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
  `],
})
export class AdminAreaComponent {
  private service = inject(AreeService);
  private uploads = inject(UploadsService);
  protected auth = inject(AuthService);
  readonly area = inject(ActivatedRoute).snapshot.paramMap.get('area') ?? '';

  readonly tab = signal<'pagina' | 'eventi'>('pagina');
  readonly eventi = signal<EventoArea[]>([]);
  readonly editingEvento = signal(false);
  readonly eventoId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly contributor = computed(() => this.auth.ruolo() === 'contributor');
  readonly nomeArea = computed(() =>
    this.auth.me()?.areeDettaglio.find((a) => a.chiave === this.area)?.nome ?? this.contenuto?.titolo ?? this.area);

  contenuto: ContenutoArea | null = null;
  evento: FormEvento = eventoVuoto();
  src = assetUrl;

  constructor() {
    this.service.contenuto(this.area).subscribe({
      next: (c) => (this.contenuto = c),
      error: (err) => this.error.set(errore(err, "Impossibile caricare l'area.")),
    });
    this.caricaEventi();
  }

  private caricaEventi(): void {
    this.service.eventi(this.area).subscribe({ next: (l) => this.eventi.set(l), error: () => {} });
  }

  private esito(e: Esito<unknown>, pubblicato: string): void {
    this.info.set(e.inAttesa
      ? 'Inviato in approvazione: comparirà sul sito quando il responsabile lo approverà.'
      : pubblicato);
  }

  carica(event: Event, dove: 'pagina' | 'evento'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploads.upload(file).subscribe({
      next: ({ url }) => {
        if (dove === 'pagina' && this.contenuto) this.contenuto.immagine = url;
        else this.evento.immagine = url;
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

  salvaContenuto(): void {
    if (!this.contenuto) return;
    this.saving.set(true);
    this.error.set('');
    this.info.set('');
    this.service.salvaContenuto(this.area, this.contenuto).subscribe({
      next: (e) => {
        this.saving.set(false);
        if (!e.inAttesa && this.contenuto) this.contenuto.esiste = true;
        this.esito(e, 'Pagina pubblicata.');
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errore(err, 'Salvataggio non riuscito.'));
      },
    });
  }

  nuovoEvento(): void {
    this.evento = eventoVuoto();
    this.eventoId.set(null);
    this.editingEvento.set(true);
    this.info.set('');
  }

  modificaEvento(e: EventoArea): void {
    this.evento = {
      titolo: e.titolo, dataInizio: isoToLocalInput(e.dataInizio), dataFine: isoToLocalInput(e.dataFine),
      luogo: e.luogo ?? '', immagine: e.immagine ?? '', descrizione: e.descrizione ?? '', pubblicato: e.pubblicato,
    };
    this.eventoId.set(e._id);
    this.editingEvento.set(true);
    this.info.set('');
  }

  salvaEvento(): void {
    const f = this.evento;
    const dati: Partial<EventoArea> = {
      titolo: f.titolo.trim(),
      descrizione: f.descrizione.trim() || undefined,
      dataInizio: localInputToIso(f.dataInizio),
      dataFine: f.dataFine ? localInputToIso(f.dataFine) : undefined,
      luogo: f.luogo.trim() || undefined,
      immagine: f.immagine || undefined,
      pubblicato: f.pubblicato,
    };
    const id = this.eventoId();
    this.saving.set(true);
    this.error.set('');
    const req = id ? this.service.modificaEvento(this.area, id, dati) : this.service.creaEvento(this.area, dati);
    req.subscribe({
      next: (e) => {
        this.saving.set(false);
        this.editingEvento.set(false);
        this.esito(e, id ? 'Evento aggiornato.' : 'Evento creato.');
        this.caricaEventi();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errore(err, 'Salvataggio non riuscito.'));
      },
    });
  }

  eliminaEvento(e: EventoArea): void {
    if (!confirm(`Eliminare l'evento "${e.titolo}"?`)) return;
    this.service.eliminaEvento(this.area, e._id).subscribe({
      next: () => this.caricaEventi(),
      error: (err) => this.error.set(errore(err, 'Eliminazione non riuscita.')),
    });
  }
}
