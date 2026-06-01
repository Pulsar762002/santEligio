import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PagineService } from '../../core/services/pagine.service';
import { Pagina } from '../../core/models/pagina.model';

type Stato =
  | { status: 'loading' }
  | { status: 'ok'; pagina: Pagina }
  | { status: 'notfound' };

// Logo opzionale accanto al titolo, per sezione.
const SEZIONE_LOGO: Record<string, string> = {
  caritas: '/assets/Caritas.webp',
  consultorio: '/assets/ConsultorioAgape.webp',
};

@Component({
  selector: 'app-pagina',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page-content">
      @switch (state().status) {
        @case ('loading') {
          <p class="empty">Caricamento…</p>
        }
        @case ('notfound') {
          <div class="notfound">
            <h1>Pagina non trovata</h1>
            <p class="empty">Il contenuto richiesto non è disponibile.</p>
            <a routerLink="/" class="btn btn-outline">Torna alla Home</a>
          </div>
        }
        @case ('ok') {
          <article class="pagina">
            <header class="pagina-header">
              <div class="header-row">
                @if (headerLogo()) {
                  <img class="header-logo" [src]="headerLogo()" [alt]="pagina()!.titolo" />
                }
                <div>
                  <h1>{{ pagina()!.titolo }}</h1>
                  @if (pagina()!.sottotitolo) {
                    <p class="sottotitolo">{{ pagina()!.sottotitolo }}</p>
                  }
                </div>
              </div>
            </header>
            @if (pagina()!.immagine) {
              <img [src]="pagina()!.immagine" [alt]="pagina()!.titolo"
                   class="pagina-img" [class.banner]="imgLandscape()" (load)="onImgLoad($event)">
            }
            <div class="prosa" [innerHTML]="pagina()!.contenuto"></div>
          </article>
        }
      }
    </div>
  `,
  styles: [`
    .pagina { max-width: 760px; margin: 0 auto; }
    .pagina-header {
      border-bottom: 2px solid var(--color-secondary);
      padding-bottom: 1rem;
      margin-bottom: 1.75rem;
    }
    .pagina-header h1 { font-size: 2.1rem; margin-bottom: .25rem; }
    .header-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .header-logo {
      height: 72px;
      width: auto;
      border-radius: 8px;
      flex: 0 0 auto;
    }
    .sottotitolo {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      font-style: italic;
      margin: 0;
    }
    .pagina-img {
      display: block;
      float: left;
      max-width: 300px;
      width: 45%;
      height: auto;
      margin: .25rem 1.75rem 1rem 0;
      border-radius: var(--radius);
      border: 4px solid white;
      box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    /* immagine orizzontale: banner allargato oltre la colonna del testo, centrato */
    .pagina-img.banner {
      float: none;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
      width: min(1100px, 92vw);
      max-width: none;
      margin: 0 0 2rem;
    }
    @media (max-width: 540px) {
      .pagina-img:not(.banner) {
        float: none;
        width: 100%;
        max-width: 320px;
        margin: 0 auto 1.5rem;
      }
    }
    .prosa { font-size: 1.02rem; }
    /* il contenuto che segue il float torna a tutta larghezza */
    .prosa::after { content: ''; display: block; clear: both; }
    .prosa ::ng-deep h3 {
      margin-top: 1.75rem;
      font-size: 1.2rem;
      color: var(--color-primary);
    }
    .prosa ::ng-deep p { margin: 0 0 1rem; }
    .prosa ::ng-deep ul {
      padding-left: 1.25rem;
      margin: 0 0 1rem;
    }
    .prosa ::ng-deep li { margin-bottom: .35rem; }
    .prosa ::ng-deep strong { color: var(--color-primary-dark); }
    .notfound { text-align: center; padding: 3rem 0; }
    .notfound a { margin-top: 1rem; }
  `],
})
export class PaginaComponent {
  private route = inject(ActivatedRoute);
  private service = inject(PagineService);

  // true se l'immagine è orizzontale → mostrata come banner a tutta larghezza
  readonly imgLandscape = signal(false);

  onImgLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.imgLandscape.set(img.naturalWidth >= img.naturalHeight * 1.3);
  }

  headerLogo(): string | null {
    const p = this.pagina();
    return p ? SEZIONE_LOGO[p.sezione] ?? null : null;
  }

  readonly state = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('slug') ?? ''),
      switchMap(slug =>
        this.service.getBySlug(slug).pipe(
          map(pagina => ({ status: 'ok', pagina }) as Stato),
          catchError(() => of({ status: 'notfound' } as Stato)),
        ),
      ),
      startWith({ status: 'loading' } as Stato),
    ),
    { initialValue: { status: 'loading' } as Stato },
  );

  pagina() {
    const s = this.state();
    return s.status === 'ok' ? s.pagina : null;
  }
}
