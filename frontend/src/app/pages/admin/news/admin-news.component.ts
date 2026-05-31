import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { News, CategoriaNews } from '../../../core/models/news.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

interface NewsForm {
  titolo: string;
  testo: string;
  categoria: CategoriaNews | '';
  immagine: string;
  pubblicato: boolean;
}

function emptyForm(): NewsForm {
  return { titolo: '', testo: '', categoria: '', immagine: '', pubblicato: false };
}

const CATEGORIE: CategoriaNews[] = ['liturgia', 'catechismo', 'caritas', 'eventi', 'comunicati'];

@Component({
  selector: 'app-admin-news',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, FormsModule, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Notizie</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuova notizia</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica notizia' : 'Nuova notizia' }}</h2>

          <div class="form-group">
            <label for="titolo">Titolo *</label>
            <input id="titolo" name="titolo" [(ngModel)]="form.titolo" required maxlength="200" />
          </div>

          <div class="form-group">
            <label for="categoria">Categoria</label>
            <select id="categoria" name="categoria" [(ngModel)]="form.categoria">
              <option value="">— Nessuna —</option>
              @for (c of categorie; track c) {
                <option [value]="c">{{ c | titlecase }}</option>
              }
            </select>
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
            <label for="testo">Testo *</label>
            <textarea id="testo" name="testo" rows="8" [(ngModel)]="form.testo"></textarea>
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
        <app-data-table
          [columns]="columns"
          [rows]="news()"
          [actions]="azioni"
          [initialSort]="{ key: 'createdAt', dir: 'desc' }"
          searchPlaceholder="Cerca notizie…"
        />
        <ng-template #azioni let-n>
          <button class="link" (click)="modifica(n)">Modifica</button>
          <button class="link danger" (click)="elimina(n)">Elimina</button>
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
    textarea { resize: vertical; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin-top: .35rem; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminNewsComponent {
  private service = inject(NewsService);
  private uploads = inject(UploadsService);

  readonly news = signal<News[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');

  readonly categorie = CATEGORIE;
  form: NewsForm = emptyForm();

  src = assetUrl;
  private dp = new DatePipe('it');
  private tc = new TitleCasePipe();

  readonly columns: ColumnDef<News>[] = [
    { key: 'immagine', label: '', type: 'image', sortable: false, filterable: false, width: '64px',
      imageUrl: n => (n.immagine ? this.src(n.immagine) : '') },
    { key: 'titolo', label: 'Titolo', value: n => n.titolo },
    { key: 'categoria', label: 'Categoria', value: n => n.categoria ?? '',
      display: n => (n.categoria ? this.tc.transform(n.categoria) : '—') },
    { key: 'createdAt', label: 'Data', type: 'date',
      value: n => (n.createdAt ? new Date(n.createdAt).getTime() : 0),
      display: n => this.dp.transform(n.createdAt, 'd MMM yyyy') ?? '' },
    { key: 'pubblicato', label: 'Stato', type: 'badge', value: n => n.pubblicato,
      badgeLabel: n => (n.pubblicato ? 'Pubblicato' : 'Bozza'), badgeOn: n => n.pubblicato },
  ];

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll(undefined, true).subscribe({
      next: list => this.news.set(list),
      error: () => this.error.set('Impossibile caricare le notizie.'),
    });
  }

  nuovo(): void {
    this.form = emptyForm();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(n: News): void {
    this.form = {
      titolo: n.titolo,
      testo: n.testo,
      categoria: n.categoria ?? '',
      immagine: n.immagine ?? '',
      pubblicato: n.pubblicato,
    };
    this.editId.set(n._id);
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
    if (!this.form.testo.trim()) {
      this.error.set('Il testo è obbligatorio.');
      return;
    }

    const payload: Partial<News> = {
      titolo: this.form.titolo.trim(),
      testo: this.form.testo.trim(),
      categoria: this.form.categoria || undefined,
      immagine: this.form.immagine || undefined,
      pubblicato: this.form.pubblicato,
    };

    this.saving.set(true);
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

  elimina(n: News): void {
    if (!confirm(`Eliminare la notizia "${n.titolo}"?`)) return;
    this.service.remove(n._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
