import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GalleriaService } from '../../core/services/galleria.service';
import { GalleriaItem } from '../../core/models/galleria.model';
import { assetUrl } from '../../core/utils/asset-url';

// Converte un URL video in URL di embed (YouTube/Vimeo) o lo lascia come file diretto.
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

@Component({
  selector: 'app-galleria',
  standalone: true,
  template: `
    <div class="container page-content">
      <header class="page-head">
        <h1>Galleria</h1>
        <p class="subtitle">Foto e video della vita della comunità</p>
      </header>

      @if (categorie().length > 0) {
        <div class="tabs">
          <button class="tab" [class.active]="attiva() === 'all'" (click)="attiva.set('all')">Tutte</button>
          @for (c of categorie(); track c.slug) {
            <button class="tab" [class.active]="attiva() === c.slug" (click)="attiva.set(c.slug)">{{ c.nome }}</button>
          }
        </div>
      }

      @if (visibili().length > 0) {
        <div class="grid">
          @for (item of visibili(); track item._id) {
            <button class="cell" (click)="apri(item)" [class.video]="item.tipo === 'video'">
              @if (item.tipo === 'foto') {
                <img [src]="src(item.url)" [alt]="item.titolo || ''" loading="lazy" />
              } @else {
                <span class="play" aria-hidden="true">▶</span>
                <span class="vlabel">{{ item.titolo || 'Video' }}</span>
              }
              @if (item.titolo && item.tipo === 'foto') { <span class="caption">{{ item.titolo }}</span> }
            </button>
          }
        </div>
      } @else {
        <p class="empty">Nessun contenuto in questa categoria.</p>
      }
    </div>

    @if (aperto()) {
      <div class="overlay" (click)="chiudi()">
        <button class="close" (click)="chiudi()" aria-label="Chiudi">✕</button>
        @if (visibili().length > 1) {
          <button class="nav prev" (click)="$event.stopPropagation(); precedente()" aria-label="Precedente">‹</button>
          <button class="nav next" (click)="$event.stopPropagation(); successivo()" aria-label="Successivo">›</button>
        }
        <div class="modal" (click)="$event.stopPropagation()">
          @if (aperto()!.tipo === 'foto') {
            <img [src]="src(aperto()!.url)" [alt]="aperto()!.titolo || ''" />
          } @else if (embedUrl()) {
            <div class="video-wrap">
              <iframe [src]="embedUrl()" frameborder="0"
                      allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
            </div>
          } @else {
            <video [src]="src(aperto()!.url)" controls autoplay></video>
          }
          @if (aperto()!.titolo) { <p class="modal-cap">{{ aperto()!.titolo }}</p> }
        </div>
      </div>
    }
  `,
  styles: [`
    .page-head { margin-bottom: 1.5rem; }
    .page-head h1 { margin-bottom: .25rem; }
    .subtitle { color: var(--color-text-muted); font-size: 1.05rem; margin: 0; }

    .tabs { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.5rem; }
    .tab {
      background: white; border: 1px solid var(--color-border); color: var(--color-text);
      padding: .4rem .9rem; border-radius: 999px; cursor: pointer; font-size: .9rem; font-weight: 500;
    }
    .tab:hover { border-color: var(--color-primary); }
    .tab.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .85rem; }
    .cell {
      position: relative; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius);
      overflow: hidden; cursor: pointer; aspect-ratio: 4/3; background: var(--color-bg-alt);
      display: flex; align-items: center; justify-content: center;
      transition: transform .15s, box-shadow .15s;
    }
    .cell:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.12); }
    .cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cell.video { background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); color: white; flex-direction: column; gap: .5rem; }
    .play { font-size: 2rem; }
    .vlabel { font-size: .9rem; font-weight: 600; padding: 0 .75rem; text-align: center; }
    .caption {
      position: absolute; left: 0; right: 0; bottom: 0; padding: .4rem .6rem;
      background: linear-gradient(transparent, rgba(0,0,0,.65)); color: white; font-size: .8rem; text-align: left;
    }

    .overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15, 20, 25, .55);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .close {
      position: absolute; top: 1rem; right: 1.25rem; z-index: 1; background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.4); color: white; width: 40px; height: 40px;
      border-radius: 50%; cursor: pointer; font-size: 1.1rem;
    }
    .close:hover { background: rgba(255,255,255,.3); }
    .nav {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 1;
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.4); color: white;
      width: 52px; height: 52px; border-radius: 50%; cursor: pointer; font-size: 1.8rem; line-height: 1;
      display: flex; align-items: center; justify-content: center;
    }
    .nav:hover { background: rgba(255,255,255,.3); }
    .nav.prev { left: 1.25rem; }
    .nav.next { right: 1.25rem; }
    @media (max-width: 560px) { .nav { width: 42px; height: 42px; font-size: 1.4rem; } .nav.prev { left: .4rem; } .nav.next { right: .4rem; } }
    .modal { max-width: 1000px; width: 100%; display: flex; flex-direction: column; align-items: center; }
    .modal img { max-width: 100%; max-height: 80vh; border-radius: var(--radius); box-shadow: 0 12px 40px rgba(0,0,0,.5); }
    .modal video { max-width: 100%; max-height: 80vh; border-radius: var(--radius); background: black; }
    .video-wrap { width: 100%; aspect-ratio: 16/9; }
    .video-wrap iframe { width: 100%; height: 100%; border-radius: var(--radius); }
    .modal-cap { color: white; margin-top: .75rem; font-size: .95rem; }
  `],
})
export class GalleriaComponent {
  private service = inject(GalleriaService);
  private sanitizer = inject(DomSanitizer);

  readonly categorie = toSignal(this.service.getCategorie(), { initialValue: [] });
  private readonly items = toSignal(this.service.getItems(), { initialValue: [] as GalleriaItem[] });

  readonly attiva = signal<string>('all');
  readonly apertoIdx = signal<number | null>(null);

  src = assetUrl;

  readonly visibili = computed(() => {
    const a = this.attiva();
    return a === 'all' ? this.items() : this.items().filter(i => i.categoria === a);
  });

  readonly aperto = computed<GalleriaItem | null>(() => {
    const i = this.apertoIdx();
    return i === null ? null : (this.visibili()[i] ?? null);
  });

  readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const it = this.aperto();
    if (!it || it.tipo !== 'video') return null;
    const yt = youtubeId(it.url);
    if (yt) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${yt}?autoplay=1`);
    const vi = vimeoId(it.url);
    if (vi) return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${vi}?autoplay=1`);
    return null; // file diretto → tag <video>
  });

  apri(item: GalleriaItem): void { this.apertoIdx.set(this.visibili().indexOf(item)); }
  chiudi(): void { this.apertoIdx.set(null); }

  precedente(): void {
    const n = this.visibili().length;
    if (n) this.apertoIdx.update(i => (i === null ? null : (i - 1 + n) % n));
  }
  successivo(): void {
    const n = this.visibili().length;
    if (n) this.apertoIdx.update(i => (i === null ? null : (i + 1) % n));
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.aperto()) this.chiudi(); }

  @HostListener('document:keydown.arrowleft')
  onLeft(): void { if (this.aperto()) this.precedente(); }

  @HostListener('document:keydown.arrowright')
  onRight(): void { if (this.aperto()) this.successivo(); }
}

