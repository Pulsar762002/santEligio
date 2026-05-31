import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PagineService } from '../../../core/services/pagine.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { Pagina, SezionePagina, SEZIONE_LABELS } from '../../../core/models/pagina.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

const SEZIONI: SezionePagina[] = [
  'parrocchia', 'parroco', 'diacono', 'caritas',
  'consultorio', 'organismi', 'sacramenti', 'gruppi', 'altro',
];

interface PaginaForm {
  slug: string;
  titolo: string;
  sottotitolo: string;
  sezione: SezionePagina;
  ordine: number;
  immagine: string;
  contenuto: string;
  pubblicato: boolean;
}

function emptyForm(): PaginaForm {
  return { slug: '', titolo: '', sottotitolo: '', sezione: 'altro', ordine: 0, immagine: '', contenuto: '', pubblicato: true };
}

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 120);
}

@Component({
  selector: 'app-admin-pagine',
  standalone: true,
  imports: [RouterLink, FormsModule, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Pagine</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuova pagina</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica pagina' : 'Nuova pagina' }}</h2>

          <div class="row">
            <div class="form-group">
              <label for="titolo">Titolo *</label>
              <input id="titolo" name="titolo" [(ngModel)]="form.titolo" required maxlength="200"
                     (blur)="suggerisciSlug()" />
            </div>
            <div class="form-group">
              <label for="sezione">Sezione *</label>
              <select id="sezione" name="sezione" [(ngModel)]="form.sezione" required>
                @for (s of sezioni; track s) { <option [value]="s">{{ label(s) }}</option> }
              </select>
            </div>
          </div>

          <div class="row">
            <div class="form-group">
              <label for="slug">Slug * <span class="hint-inline">(URL: /p/slug)</span></label>
              <input id="slug" name="slug" [(ngModel)]="form.slug" required maxlength="120" />
            </div>
            <div class="form-group">
              <label for="ordine">Ordine</label>
              <input id="ordine" name="ordine" type="number" [(ngModel)]="form.ordine" />
            </div>
          </div>

          <div class="form-group">
            <label for="sottotitolo">Sottotitolo</label>
            <input id="sottotitolo" name="sottotitolo" [(ngModel)]="form.sottotitolo" maxlength="300" />
          </div>

          <div class="form-group">
            <label>Immagine</label>
            @if (form.immagine) {
              <div class="img-preview">
                <img [src]="src(form.immagine)" alt="Anteprima" />
                <button type="button" class="link danger" (click)="form.immagine = ''">Rimuovi</button>
              </div>
            }
            <input type="file" accept="image/png,image/jpeg,image/webp"
                   (change)="caricaImmagine($event)" [disabled]="uploading()" />
            @if (uploading()) { <span class="hint">Caricamento…</span> }
          </div>

          <div class="form-group">
            <label for="contenuto">Contenuto *</label>
            <textarea id="contenuto" name="contenuto" rows="14" [(ngModel)]="form.contenuto"
                      class="mono"></textarea>
            <span class="hint">Accetta HTML: &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;&lt;li&gt;, &lt;strong&gt;, &lt;br&gt;…</span>
          </div>

          <label class="check">
            <input type="checkbox" name="pubblicato" [(ngModel)]="form.pubblicato" />
            Pubblicata (visibile sul sito)
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Salva' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="annulla()" [disabled]="saving()">Annulla</button>
          </div>
        </form>
      } @else {
        <app-data-table
          [columns]="columns"
          [rows]="pagine()"
          [actions]="azioni"
          [initialSort]="{ key: 'sezione', dir: 'asc' }"
          searchPlaceholder="Cerca pagine…"
        />
        <ng-template #azioni let-p>
          <a class="link" [href]="'/p/' + p.slug" target="_blank" rel="noopener">Vedi</a>
          <button class="link" (click)="modifica(p)">Modifica</button>
          <button class="link danger" (click)="elimina(p)">Elimina</button>
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
    textarea { resize: vertical; }
    textarea.mono { font-family: ui-monospace, monospace; font-size: .85rem; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin-top: .35rem; }
    .hint-inline { font-weight: 400; color: var(--color-text-muted); font-size: .8rem; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminPagineComponent {
  private service = inject(PagineService);
  private uploads = inject(UploadsService);

  readonly pagine = signal<Pagina[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');

  readonly sezioni = SEZIONI;
  form: PaginaForm = emptyForm();
  src = assetUrl;

  readonly columns: ColumnDef<Pagina>[] = [
    { key: 'sezione', label: 'Sezione', value: p => p.sezione, display: p => this.label(p.sezione) },
    { key: 'titolo', label: 'Titolo', value: p => p.titolo },
    { key: 'slug', label: 'Slug', value: p => p.slug },
    { key: 'ordine', label: 'Ordine', type: 'number', value: p => p.ordine },
    { key: 'pubblicato', label: 'Stato', type: 'badge', value: p => p.pubblicato,
      badgeLabel: p => (p.pubblicato ? 'Pubblicata' : 'Bozza'), badgeOn: p => p.pubblicato },
  ];

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll(undefined, true).subscribe({
      next: list => this.pagine.set(list),
      error: () => this.error.set('Impossibile caricare le pagine.'),
    });
  }

  label(s: SezionePagina): string {
    return SEZIONE_LABELS[s];
  }

  nuovo(): void {
    this.form = emptyForm();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(p: Pagina): void {
    this.form = {
      slug: p.slug,
      titolo: p.titolo,
      sottotitolo: p.sottotitolo ?? '',
      sezione: p.sezione,
      ordine: p.ordine,
      immagine: p.immagine ?? '',
      contenuto: p.contenuto,
      pubblicato: p.pubblicato,
    };
    this.editId.set(p._id);
    this.editing.set(true);
    this.error.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  suggerisciSlug(): void {
    if (!this.editId() && !this.form.slug.trim() && this.form.titolo.trim()) {
      this.form.slug = slugify(this.form.titolo);
    }
  }

  caricaImmagine(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.uploads.upload(file).subscribe({
      next: ({ url }) => { this.form.immagine = url; this.uploading.set(false); input.value = ''; },
      error: () => { this.uploading.set(false); input.value = ''; this.error.set('Caricamento immagine non riuscito.'); },
    });
  }

  salva(): void {
    this.error.set('');
    if (!this.form.titolo.trim()) { this.error.set('Il titolo è obbligatorio.'); return; }
    if (!this.form.slug.trim()) { this.error.set('Lo slug è obbligatorio.'); return; }
    if (!this.form.contenuto.trim()) { this.error.set('Il contenuto è obbligatorio.'); return; }

    const payload: Partial<Pagina> = {
      slug: slugify(this.form.slug),
      titolo: this.form.titolo.trim(),
      sottotitolo: this.form.sottotitolo.trim() || undefined,
      sezione: this.form.sezione,
      ordine: Number(this.form.ordine) || 0,
      immagine: this.form.immagine || undefined,
      contenuto: this.form.contenuto,
      pubblicato: this.form.pubblicato,
    };

    this.saving.set(true);
    const id = this.editId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.editing.set(false); this.ricarica(); },
      error: (err) => {
        this.saving.set(false);
        const dettaglio = err?.error?.message;
        const msg = Array.isArray(dettaglio) ? dettaglio.join(', ') : dettaglio;
        this.error.set(msg ? `Salvataggio non riuscito: ${msg}` : 'Salvataggio non riuscito. Controlla i campi (slug duplicato?).');
      },
    });
  }

  elimina(p: Pagina): void {
    if (!confirm(`Eliminare la pagina "${p.titolo}"?`)) return;
    this.service.remove(p._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
