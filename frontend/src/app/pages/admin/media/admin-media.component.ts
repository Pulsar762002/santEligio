import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MediaService } from '../../../core/services/media.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { Media } from '../../../core/models/media.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(m: Media): boolean {
  return !!m.mimetype && m.mimetype.startsWith('image/');
}

function tipoLabel(m: Media): string {
  if (!m.mimetype) return '—';
  return m.mimetype.split('/')[1]?.toUpperCase() ?? m.mimetype;
}

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [RouterLink, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Libreria Media</h1>
        </div>
        <label class="btn btn-primary upload-btn">
          {{ uploading() ? 'Caricamento…' : '+ Carica file' }}
          <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
                 (change)="carica($event)" [disabled]="uploading()" hidden />
        </label>
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-info">{{ info() }}</div> }

      <app-data-table
        [columns]="columns"
        [rows]="media()"
        [actions]="azioni"
        [initialSort]="{ key: 'createdAt', dir: 'desc' }"
        searchPlaceholder="Cerca file…"
      />
      <ng-template #azioni let-m>
        <button class="link" (click)="copiaUrl(m)">Copia URL</button>
        <a class="link" [href]="src(m.url)" target="_blank" rel="noopener">Apri</a>
        <button class="link danger" (click)="elimina(m)">Elimina</button>
      </ng-template>

      <p class="hint">PNG, JPG, WebP o PDF — max 10 MB. I file caricati qui sono
        riutilizzabili (l'URL può essere incollato nei contenuti).</p>
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .upload-btn { cursor: pointer; }
    .upload-btn input:disabled { cursor: not-allowed; }
    .alert-info { background: color-mix(in srgb, var(--color-primary) 10%, white); color: var(--color-primary-dark); border: 1px solid color-mix(in srgb, var(--color-primary) 30%, white); }
    .hint { font-size: .85rem; color: var(--color-text-muted); margin-top: 1rem; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminMediaComponent {
  private service = inject(MediaService);
  private uploads = inject(UploadsService);

  readonly media = signal<Media[]>([]);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly info = signal('');

  src = assetUrl;
  private dp = new DatePipe('it');

  readonly columns: ColumnDef<Media>[] = [
    { key: 'url', label: '', type: 'image', sortable: false, filterable: false, width: '64px',
      imageUrl: m => (isImage(m) ? this.src(m.url) : '') },
    { key: 'originalName', label: 'Nome', value: m => m.originalName },
    { key: 'mimetype', label: 'Tipo', value: m => m.mimetype ?? '', display: m => tipoLabel(m) },
    { key: 'size', label: 'Dimensione', type: 'number', value: m => m.size, display: m => formatSize(m.size) },
    { key: 'createdAt', label: 'Caricato', type: 'date',
      value: m => (m.createdAt ? new Date(m.createdAt).getTime() : 0),
      display: m => this.dp.transform(m.createdAt, 'd MMM yyyy, HH:mm') ?? '' },
  ];

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll().subscribe({
      next: list => this.media.set(list),
      error: () => this.error.set('Impossibile caricare la libreria.'),
    });
  }

  carica(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');
    this.info.set('');
    this.uploads.upload(file).subscribe({
      next: () => {
        this.uploading.set(false);
        input.value = '';
        this.ricarica();
      },
      error: () => {
        this.uploading.set(false);
        input.value = '';
        this.error.set('Caricamento non riuscito (tipo non consentito o file troppo grande?).');
      },
    });
  }

  copiaUrl(m: Media): void {
    const url = this.src(m.url);
    navigator.clipboard?.writeText(url).then(
      () => { this.info.set('URL copiato negli appunti.'); setTimeout(() => this.info.set(''), 2500); },
      () => this.error.set('Copia non riuscita.'),
    );
  }

  elimina(m: Media): void {
    if (!confirm(`Eliminare "${m.originalName}"? Il file verrà rimosso dal server.`)) return;
    this.service.remove(m._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
