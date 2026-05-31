import { Component, inject } from '@angular/core';
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
            <a routerLink="/parrocchia" class="btn btn-outline">Torna alla Parrocchia</a>
          </div>
        }
        @case ('ok') {
          <article class="pagina">
            <header class="pagina-header">
              <h1>{{ pagina()!.titolo }}</h1>
              @if (pagina()!.sottotitolo) {
                <p class="sottotitolo">{{ pagina()!.sottotitolo }}</p>
              }
            </header>
            @if (pagina()!.immagine) {
              <img [src]="pagina()!.immagine" [alt]="pagina()!.titolo" class="pagina-img">
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
    .sottotitolo {
      color: var(--color-text-muted);
      font-size: 1.1rem;
      font-style: italic;
      margin: 0;
    }
    .pagina-img {
      width: 100%;
      border-radius: var(--radius);
      margin-bottom: 1.75rem;
    }
    .prosa { font-size: 1.02rem; }
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
