import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GalleriaService } from '../../../core/services/galleria.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { GalleriaCategoria, GalleriaItem, TipoMedia } from '../../../core/models/galleria.model';
import { assetUrl } from '../../../core/utils/asset-url';

@Component({
  selector: 'app-admin-galleria',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Galleria</h1>
        </div>
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-info">{{ info() }}</div> }

      <!-- CATEGORIE -->
      <section class="card">
        <h2>Categorie</h2>
        <div class="cat-list">
          @for (c of categorie(); track c._id) {
            <span class="cat-chip">
              {{ c.nome }}
              <button class="x" (click)="eliminaCategoria(c)" title="Elimina categoria">✕</button>
            </span>
          }
          @if (categorie().length === 0) { <span class="muted">Nessuna categoria.</span> }
        </div>
        <form class="inline" (ngSubmit)="aggiungiCategoria()">
          <input name="nuovaCat" [(ngModel)]="nuovaCategoria" placeholder="Nuova categoria (es. La Chiesa)" />
          <button type="submit" class="btn btn-primary" [disabled]="!nuovaCategoria.trim()">+ Aggiungi</button>
        </form>
      </section>

      <!-- NUOVO CONTENUTO -->
      <section class="card">
        <h2>Aggiungi foto o video</h2>
        @if (categorie().length === 0) {
          <p class="muted">Crea prima una categoria.</p>
        } @else {
          <div class="row">
            <div class="form-group">
              <label>Categoria</label>
              <select name="cat" [(ngModel)]="form.categoria">
                @for (c of categorie(); track c.slug) { <option [value]="c.slug">{{ c.nome }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label>Tipo</label>
              <select name="tipo" [(ngModel)]="form.tipo">
                <option value="foto">Foto</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Titolo (opzionale)</label>
            <input name="tit" [(ngModel)]="form.titolo" />
          </div>

          @if (form.tipo === 'foto') {
            <div class="form-group">
              <label>Immagine</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" (change)="carica($event)" [disabled]="uploading()" />
            </div>
          } @else {
            <div class="form-group">
              <label>URL video (YouTube, Vimeo o link diretto .mp4)</label>
              <input name="vurl" [(ngModel)]="form.url" placeholder="https://www.youtube.com/watch?v=..." />
              <span class="hint">…oppure carica un file video:</span>
              <input type="file" accept="video/mp4,video/webm" (change)="carica($event)" [disabled]="uploading()" />
            </div>
          }

          @if (uploading()) { <p class="muted">Caricamento file…</p> }
          @if (form.url && form.tipo === 'foto') {
            <img class="preview" [src]="src(form.url)" alt="anteprima" />
          }
          @if (form.url) { <p class="muted small">URL: {{ form.url }}</p> }

          <button class="btn btn-primary" (click)="aggiungiItem()" [disabled]="saving() || !form.categoria || !form.url">
            {{ saving() ? 'Salvataggio…' : 'Aggiungi alla galleria' }}
          </button>
        }
      </section>

      <!-- ELENCO CONTENUTI -->
      <section class="card">
        <div class="filtri">
          <h2>Contenuti</h2>
          <select [(ngModel)]="filtro" name="filtro">
            <option value="all">Tutte le categorie</option>
            @for (c of categorie(); track c.slug) { <option [value]="c.slug">{{ c.nome }}</option> }
          </select>
        </div>
        @if (visibili().length > 0) {
          <div class="thumbs">
            @for (it of visibili(); track it._id) {
              <div class="thumb" [class.video]="it.tipo === 'video'">
                @if (it.tipo === 'foto') { <img [src]="src(it.url)" [alt]="it.titolo || ''" /> }
                @else { <span class="play">▶</span> }
                <span class="meta">{{ it.titolo || (it.tipo === 'video' ? 'Video' : 'Foto') }} · {{ nomeCat(it.categoria) }}</span>
                <button class="del" (click)="eliminaItem(it)" title="Elimina">✕</button>
              </div>
            }
          </div>
        } @else {
          <p class="muted">Nessun contenuto.</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .head { margin-bottom: 1.5rem; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.5rem; margin-bottom: 1.25rem; }
    .card h2 { margin-top: 0; font-size: 1.15rem; }
    .muted { color: var(--color-text-muted); }
    .small { font-size: .8rem; word-break: break-all; }
    .alert-info { background: color-mix(in srgb, var(--color-primary) 10%, white); color: var(--color-primary-dark); border: 1px solid color-mix(in srgb, var(--color-primary) 30%, white); }

    .cat-list { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
    .cat-chip { display: inline-flex; align-items: center; gap: .4rem; background: var(--color-bg-alt); border: 1px solid var(--color-border); border-radius: 999px; padding: .25rem .75rem; font-size: .9rem; }
    .cat-chip .x { background: none; border: none; color: #b91c1c; cursor: pointer; font-size: .8rem; }
    .inline { display: flex; gap: .5rem; flex-wrap: wrap; }
    .inline input { flex: 1 1 240px; }

    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin: .5rem 0 .35rem; }
    .preview { max-width: 240px; border-radius: var(--radius); border: 1px solid var(--color-border); margin: .5rem 0; display: block; }

    .filtri { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .filtri select { max-width: 220px; }
    .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .75rem; margin-top: 1rem; }
    .thumb { position: relative; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; background: var(--color-bg-alt); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .thumb.video { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white; }
    .thumb .play { font-size: 1.6rem; }
    .thumb .meta { position: absolute; left: 0; right: 0; bottom: 0; font-size: .72rem; padding: .25rem .4rem; background: linear-gradient(transparent, rgba(0,0,0,.7)); color: white; }
    .thumb .del { position: absolute; top: .3rem; right: .3rem; background: rgba(0,0,0,.55); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; }
  `],
})
export class AdminGalleriaComponent {
  private service = inject(GalleriaService);
  private uploads = inject(UploadsService);

  readonly categorie = signal<GalleriaCategoria[]>([]);
  readonly items = signal<GalleriaItem[]>([]);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly info = signal('');

  nuovaCategoria = '';
  filtro = 'all';
  form: { categoria: string; tipo: TipoMedia; titolo: string; url: string } =
    { categoria: '', tipo: 'foto', titolo: '', url: '' };

  src = assetUrl;

  readonly visibili = computed(() =>
    this.filtro === 'all' ? this.items() : this.items().filter(i => i.categoria === this.filtro),
  );

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getCategorie().subscribe({
      next: list => { this.categorie.set(list); if (!this.form.categoria && list[0]) this.form.categoria = list[0].slug; },
      error: () => this.error.set('Impossibile caricare le categorie.'),
    });
    this.service.getItems().subscribe({
      next: list => this.items.set(list),
      error: () => this.error.set('Impossibile caricare i contenuti.'),
    });
  }

  nomeCat(slug: string): string {
    return this.categorie().find(c => c.slug === slug)?.nome ?? slug;
  }

  aggiungiCategoria(): void {
    const nome = this.nuovaCategoria.trim();
    if (!nome) return;
    this.error.set('');
    this.service.createCategoria({ nome }).subscribe({
      next: () => { this.nuovaCategoria = ''; this.ricarica(); },
      error: () => this.error.set('Creazione categoria non riuscita (nome/slug duplicato?).'),
    });
  }

  eliminaCategoria(c: GalleriaCategoria): void {
    if (!confirm(`Eliminare la categoria "${c.nome}"? Verranno rimossi anche i suoi contenuti.`)) return;
    this.service.removeCategoria(c._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione categoria non riuscita.'),
    });
  }

  carica(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set('');
    this.uploads.upload(file).subscribe({
      next: ({ url }) => { this.form.url = url; this.uploading.set(false); input.value = ''; },
      error: () => { this.uploading.set(false); input.value = ''; this.error.set('Caricamento non riuscito (tipo non consentito o file troppo grande).'); },
    });
  }

  aggiungiItem(): void {
    if (!this.form.categoria || !this.form.url) return;
    this.saving.set(true);
    this.error.set('');
    this.service.createItem({
      categoria: this.form.categoria,
      tipo: this.form.tipo,
      url: this.form.url.trim(),
      titolo: this.form.titolo.trim() || undefined,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.info.set('Contenuto aggiunto.'); setTimeout(() => this.info.set(''), 2000);
        this.form = { categoria: this.form.categoria, tipo: this.form.tipo, titolo: '', url: '' };
        this.ricarica();
      },
      error: () => { this.saving.set(false); this.error.set('Aggiunta non riuscita.'); },
    });
  }

  eliminaItem(it: GalleriaItem): void {
    if (!confirm('Eliminare questo contenuto?')) return;
    this.service.removeItem(it._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
