import { Component, computed, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PagineService } from '../../core/services/pagine.service';
import { SezionePagina, SEZIONE_LABELS } from '../../core/models/pagina.model';

const SEZIONI: SezionePagina[] = [
  'parrocchia', 'parroco', 'diacono', 'caritas',
  'consultorio', 'organismi', 'sacramenti', 'gruppi', 'altro',
];

// Logo opzionale accanto al titolo della sezione.
const SEZIONE_IMG: Partial<Record<SezionePagina, string>> = {
  caritas: '/assets/Caritas.webp',
  consultorio: '/assets/ConsultorioAgape.webp',
};

@Component({
  selector: 'app-parrocchia',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-sm">
      <div class="container hero-inner">
        @if (sezioneImg()) {
          <img class="sez-logo" [src]="sezioneImg()" [alt]="label(sezione())" />
        }
        <div>
          <h1>{{ label(sezione()) }}</h1>
          @if (sezione() === 'parrocchia') {
            <p>Conosci la comunità di Sant'Eligio: la sua storia, i pastori, i servizi e gli organismi.</p>
          }
        </div>
      </div>
    </section>

    <div class="container page-content">
      @if (pagine().length > 0) {
        <div class="card-grid">
          @for (pagina of pagine(); track pagina._id) {
            <a class="card pagina-card" [routerLink]="['/p', pagina.slug]">
              <h3>{{ pagina.titolo }}</h3>
              @if (pagina.sottotitolo) {
                <p class="sottotitolo">{{ pagina.sottotitolo }}</p>
              }
              <span class="link-more">Leggi &rarr;</span>
            </a>
          }
        </div>
      } @else {
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
    .hero-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      text-align: left;
    }
    .sez-logo {
      height: 84px;
      width: auto;
      border-radius: 8px;
      background: white;
      padding: 6px;
      flex: 0 0 auto;
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
  private route = inject(ActivatedRoute);

  private readonly tutte = toSignal(this.service.getAll(), { initialValue: [] });

  readonly sezione = toSignal(
    this.route.paramMap.pipe(
      map(p => {
        const s = p.get('sezione') as SezionePagina | null;
        return s && SEZIONI.includes(s) ? s : 'parrocchia';
      }),
    ),
    { initialValue: 'parrocchia' as SezionePagina },
  );

  readonly pagine = computed(() =>
    this.tutte()
      .filter(p => p.sezione === this.sezione())
      .sort((a, b) => a.ordine - b.ordine),
  );

  readonly sezioneImg = computed(() => SEZIONE_IMG[this.sezione()] ?? null);

  label(sezione: SezionePagina): string {
    return SEZIONE_LABELS[sezione];
  }
}
