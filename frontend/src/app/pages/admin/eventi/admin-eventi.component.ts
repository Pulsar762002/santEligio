import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventiService } from '../../../core/services/eventi.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { Evento } from '../../../core/models/evento.model';
import { assetUrl } from '../../../core/utils/asset-url';

interface EventoForm {
  titolo: string;
  descrizione: string;
  dataInizio: string; // datetime-local: YYYY-MM-DDTHH:mm
  dataFine: string;
  luogo: string;
  immagine: string;
  pubblicato: boolean;
}

function emptyForm(): EventoForm {
  return { titolo: '', descrizione: '', dataInizio: '', dataFine: '', luogo: '', immagine: '', pubblicato: false };
}

// ISO (dal backend) -> valore per <input type="datetime-local"> in ora locale
function isoToLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local -> ISO string per il backend (IsDateString)
function localInputToIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

@Component({
  selector: 'app-admin-eventi',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Eventi</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuovo evento</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica evento' : 'Nuovo evento' }}</h2>

          <div class="form-group">
            <label for="titolo">Titolo *</label>
            <input id="titolo" name="titolo" [(ngModel)]="form.titolo" required maxlength="200" />
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
                <button type="button" class="link danger" (click)="rimuoviImmagine()">Rimuovi</button>
              </div>
            }
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              (change)="caricaImmagine($event)"
              [disabled]="uploading()"
            />
            @if (uploading()) { <span class="hint">Caricamento immagine…</span> }
            <span class="hint">PNG, JPG o WebP — max 10 MB.</span>
          </div>

          <div class="form-group">
            <label for="descrizione">Descrizione</label>
            <textarea id="descrizione" name="descrizione" rows="4" [(ngModel)]="form.descrizione"></textarea>
          </div>

          <label class="check">
            <input type="checkbox" name="pubblicato" [(ngModel)]="form.pubblicato" />
            Pubblicato (visibile sul sito)
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Salva' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="annulla()" [disabled]="saving()">Annulla</button>
          </div>
        </form>
      } @else {
        @if (eventi().length > 0) {
          <table class="grid">
            <thead>
              <tr><th></th><th>Titolo</th><th>Inizio</th><th>Luogo</th><th>Stato</th><th></th></tr>
            </thead>
            <tbody>
              @for (e of eventi(); track e._id) {
                <tr>
                  <td class="thumb-cell">
                    @if (e.immagine) {
                      <img class="thumb" [src]="src(e.immagine)" [alt]="e.titolo" />
                    } @else {
                      <span class="thumb placeholder">—</span>
                    }
                  </td>
                  <td>{{ e.titolo }}</td>
                  <td>{{ e.dataInizio | date:'d MMM yyyy, HH:mm':'':'it' }}</td>
                  <td>{{ e.luogo || '—' }}</td>
                  <td>
                    <span class="badge" [class.pub]="e.pubblicato">
                      {{ e.pubblicato ? 'Pubblicato' : 'Bozza' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="link" (click)="modifica(e)">Modifica</button>
                    <button class="link danger" (click)="elimina(e)">Elimina</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">Nessun evento. Creane uno con “+ Nuovo evento”.</p>
        }
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
    textarea { resize: vertical; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin-top: .35rem; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .thumb-cell { width: 64px; }
    .thumb { display: block; width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--color-border); }
    .thumb.placeholder { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); background: var(--color-bg-alt); }
    .grid { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .grid th, .grid td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .grid th { background: var(--color-bg-alt); font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; color: var(--color-text-muted); }
    .grid tr:last-child td { border-bottom: none; }
    .badge { font-size: .75rem; padding: .15rem .5rem; border-radius: 999px; background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); }
    .badge.pub { background: color-mix(in srgb, var(--color-primary) 12%, white); color: var(--color-primary-dark); border-color: color-mix(in srgb, var(--color-primary) 35%, white); }
    .actions { white-space: nowrap; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminEventiComponent {
  private service = inject(EventiService);
  private uploads = inject(UploadsService);

  readonly eventi = signal<Evento[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');

  form: EventoForm = emptyForm();

  src = assetUrl;

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll(true).subscribe({
      next: list => this.eventi.set(list),
      error: () => this.error.set('Impossibile caricare gli eventi.'),
    });
  }

  nuovo(): void {
    this.form = emptyForm();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(e: Evento): void {
    this.form = {
      titolo: e.titolo,
      descrizione: e.descrizione ?? '',
      dataInizio: isoToLocalInput(e.dataInizio),
      dataFine: isoToLocalInput(e.dataFine),
      luogo: e.luogo ?? '',
      immagine: e.immagine ?? '',
      pubblicato: e.pubblicato,
    };
    this.editId.set(e._id);
    this.editing.set(true);
    this.error.set('');
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

  rimuoviImmagine(): void {
    this.form.immagine = '';
  }

  salva(): void {
    this.error.set('');

    if (!this.form.titolo.trim()) {
      this.error.set('Il titolo è obbligatorio.');
      return;
    }
    if (!this.form.dataInizio) {
      this.error.set('La data e ora di inizio sono obbligatorie.');
      return;
    }

    const payload: Partial<Evento> = {
      titolo: this.form.titolo.trim(),
      descrizione: this.form.descrizione.trim() || undefined,
      dataInizio: localInputToIso(this.form.dataInizio),
      dataFine: this.form.dataFine ? localInputToIso(this.form.dataFine) : undefined,
      luogo: this.form.luogo.trim() || undefined,
      immagine: this.form.immagine || undefined,
      pubblicato: this.form.pubblicato,
    };

    this.saving.set(true);
    this.error.set('');
    const id = this.editId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
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
    this.service.remove(e._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
