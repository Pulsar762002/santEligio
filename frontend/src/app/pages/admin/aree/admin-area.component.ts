import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AreeService } from '../../../core/services/aree.service';
import { AuthService } from '../../../core/services/auth.service';
import { UploadsService } from '../../../core/services/uploads.service';
import { ContenutoArea, Esito } from '../../../core/models/area.model';
import { assetUrl } from '../../../core/utils/asset-url';
import { EditorTestoComponent } from '../../../shared/editor-testo/editor-testo.component';

function errore(err: any, fallback: string): string {
  const m = err?.error?.message;
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' && m ? m : fallback;
}

@Component({
  selector: 'app-admin-area',
  standalone: true,
  imports: [FormsModule, RouterLink, EditorTestoComponent],
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

      <div class="barra-area">
        <span>Pagina dell'area</span>
        <a [routerLink]="['/admin/eventi']" [queryParams]="{ area: area }" class="btn btn-outline">Eventi dell'area →</a>
      </div>

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
            <input type="file" accept="image/*" (change)="carica($event)" [disabled]="uploading()" />
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
    </div>
  `,
  styles: [`
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    h1 { margin: 0 0 1rem; }
    .barra-area { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;
                  padding-bottom: .6rem; border-bottom: 1px solid var(--color-border); font-weight: 600; color: var(--color-primary-dark); }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.5rem; }
    .hint { font-size: .85rem; color: #b45309; margin-top: 0; }
    .img-preview { display: flex; align-items: flex-start; gap: .75rem; margin-bottom: .6rem; }
    .img-preview img { max-width: 220px; max-height: 140px; border-radius: var(--radius); border: 1px solid var(--color-border); object-fit: cover; }
    .form-actions { display: flex; gap: .75rem; }
    .alert-ok { background: #e7f6ec; color: #166534; border: 1px solid #86efac; }
    .alert-info { background: var(--color-bg-alt); border: 1px solid var(--color-border); }
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

  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  readonly contributor = computed(() => this.auth.ruolo() === 'contributor');
  readonly nomeArea = computed(() =>
    this.auth.me()?.areeDettaglio.find((a) => a.chiave === this.area)?.nome ?? this.contenuto?.titolo ?? this.area);

  contenuto: ContenutoArea | null = null;
  src = assetUrl;

  constructor() {
    this.service.contenuto(this.area).subscribe({
      next: (c) => (this.contenuto = c),
      error: (err) => this.error.set(errore(err, "Impossibile caricare l'area.")),
    });
  }

  private esito(e: Esito<unknown>, pubblicato: string): void {
    this.info.set(e.inAttesa
      ? 'Inviato in approvazione: comparirà sul sito quando il responsabile lo approverà.'
      : pubblicato);
  }

  carica(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.uploads.upload(file).subscribe({
      next: ({ url }) => {
        if (this.contenuto) this.contenuto.immagine = url;
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
}
