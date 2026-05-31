import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { PagineService } from '../../core/services/pagine.service';
import { SezionePagina, SEZIONE_LABELS } from '../../core/models/pagina.model';

@Component({
  selector: 'app-parrocchia',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>La nostra Parrocchia</h1>
        <p>Conosci la comunità di Sant'Eligio: la sua storia, i pastori, i servizi e gli organismi.</p>
      </div>
    </section>

    <div class="container page-content">
      @for (gruppo of gruppi(); track gruppo.sezione) {
        <section class="sezione">
          <h2>{{ label(gruppo.sezione) }}</h2>
          <div class="card-grid">
            @for (pagina of gruppo.pagine; track pagina._id) {
              <a class="card pagina-card" [routerLink]="['/p', pagina.slug]">
                <h3>{{ pagina.titolo }}</h3>
                @if (pagina.sottotitolo) {
                  <p class="sottotitolo">{{ pagina.sottotitolo }}</p>
                }
                <span class="link-more">Leggi &rarr;</span>
              </a>
            }
          </div>
        </section>
      }

      @if (gruppi().length === 0) {
        <p class="empty">Nessun contenuto disponibile.</p>
      }
    </div>
  `,
  styles: [`
    .hero-sm {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: white;
      padding: 2.5rem 0;
      text-align: center;
    }
    .hero-sm h1 { color: white; margin-bottom: .4rem; }
    .hero-sm p { opacity: .85; margin: 0; }
    .sezione { margin-bottom: 2.75rem; }
    .sezione h2 {
      border-left: 4px solid var(--color-secondary);
      padding-left: .75rem;
      margin-bottom: 1rem;
    }
    .pagina-card {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      color: var(--color-text);
      transition: transform .15s, box-shadow .15s, border-color .15s;
    }
    .pagina-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(0,0,0,.08);
      border-color: var(--color-secondary);
      text-decoration: none;
    }
    .pagina-card h3 { color: var(--color-primary); }
    .sottotitolo {
      color: var(--color-text-muted);
      font-size: .9rem;
      font-style: italic;
      flex: 1;
    }
    .link-more { margin-top: .75rem; }
  `],
})
export class ParrocchiaComponent {
  private service = inject(PagineService);

  private readonly pagine = toSignal(this.service.getAll(), { initialValue: [] });

  readonly gruppi = computed(() => {
    const order: SezionePagina[] = [
      'parrocchia', 'parroco', 'diacono', 'caritas',
      'consultorio', 'organismi', 'sacramenti', 'altro',
    ];
    return order
      .map(sezione => ({
        sezione,
        pagine: this.pagine()
          .filter(p => p.sezione === sezione)
          .sort((a, b) => a.ordine - b.ordine),
      }))
      .filter(g => g.pagine.length > 0);
  });

  label(sezione: SezionePagina): string {
    return SEZIONE_LABELS[sezione];
  }
}
