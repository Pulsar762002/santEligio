import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NewsService } from '../../../core/services/news.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { News, CategoriaNews } from '../../../core/models/news.model';
import { assetUrl } from '../../../core/utils/asset-url';

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
  imports: [RouterLink, DatePipe, TitleCasePipe, FormsModule],
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
        @if (news().length > 0) {
          <table class="grid">
            <thead>
              <tr><th></th><th>Titolo</th><th>Categoria</th><th>Data</th><th>Stato</th><th></th></tr>
            </thead>
            <tbody>
              @for (n of news(); track n._id) {
                <tr>
                  <td class="thumb-cell">
                    @if (n.immagine) {
                      <img class="thumb" [src]="src(n.immagine)" [alt]="n.titolo" />
                    } @else {
                      <span class="thumb placeholder">—</span>
                    }
                  </td>
                  <td>{{ n.titolo }}</td>
                  <td>{{ n.categoria ? (n.categoria | titlecase) : '—' }}</td>
                  <td>{{ n.createdAt | date:'d MMM yyyy':'':'it' }}</td>
                  <td>
                    <span class="badge" [class.pub]="n.pubblicato">
                      {{ n.pubblicato ? 'Pubblicato' : 'Bozza' }}
                    </span>
                  </td>
                  <td class="actions">
                    <button class="link" (click)="modifica(n)">Modifica</button>
                    <button class="link danger" (click)="elimina(n)">Elimina</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">Nessuna notizia. Creane una con “+ Nuova notizia”.</p>
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
    textarea { resize: vertical; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin-top: .35rem; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .grid { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .grid th, .grid td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid var(--color-border); font-size: .9rem; }
    .grid th { background: var(--color-bg-alt); font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; color: var(--color-text-muted); }
    .grid tr:last-child td { border-bottom: none; }
    .thumb-cell { width: 64px; }
    .thumb { display: block; width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--color-border); }
    .thumb.placeholder { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); background: var(--color-bg-alt); }
    .badge { font-size: .75rem; padding: .15rem .5rem; border-radius: 999px; background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); }
    .badge.pub { background: color-mix(in srgb, var(--color-primary) 12%, white); color: var(--color-primary-dark); border-color: color-mix(in srgb, var(--color-primary) 35%, white); }
    .actions { white-space: nowrap; }
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
