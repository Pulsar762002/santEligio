import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { GruppiService } from '../../core/services/gruppi.service';
import { AreaGruppo, AREA_LABELS } from '../../core/models/gruppo.model';

const AREE: AreaGruppo[] = ['liturgia', 'catechesi', 'carita'];

@Component({
  selector: 'app-gruppi',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero-sm">
      <div class="container">
        <h1>{{ area() ? label(area()!) : 'Gruppi e Movimenti' }}</h1>
        <p>Le realtà che animano la vita della comunità parrocchiale.</p>
      </div>
    </section>

    <div class="container page-content">
      @for (gruppo of aree(); track gruppo.area) {
        <section class="area">
          @if (!area()) { <h2>{{ label(gruppo.area) }}</h2> }
          <div class="card-grid">
            @for (g of gruppo.gruppi; track g._id) {
              @if (g.slug) {
                <a class="card gruppo-card clickable" [routerLink]="['/gruppi', g.area, g.slug]">
                  <h3>{{ g.nome }}</h3>
                  @if (g.descrizione) { <p>{{ g.descrizione }}</p> }
                  @if (g.referente) { <p class="meta"><strong>Referente:</strong> {{ g.referente }}</p> }
                  @if (g.contatto) { <p class="meta">{{ g.contatto }}</p> }
                  <span class="more">Scopri di più &rarr;</span>
                </a>
              } @else {
                <article class="card gruppo-card">
                  <h3>{{ g.nome }}</h3>
                  @if (g.descrizione) { <p>{{ g.descrizione }}</p> }
                  @if (g.referente) { <p class="meta"><strong>Referente:</strong> {{ g.referente }}</p> }
                  @if (g.contatto) { <p class="meta">{{ g.contatto }}</p> }
                </article>
              }
            }
          </div>
        </section>
      }

      @if (aree().length === 0) {
        <p class="empty">Nessun gruppo disponibile.</p>
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
    .area { margin-bottom: 2.75rem; }
    .area h2 {
      border-left: 4px solid var(--color-secondary);
      padding-left: .75rem;
      margin-bottom: 1rem;
    }
    .gruppo-card h3 { color: var(--color-primary); }
    .gruppo-card p { margin: .35rem 0 0; font-size: .95rem; }
    .meta { color: var(--color-text-muted); font-size: .88rem; }
    a.gruppo-card.clickable {
      display: block;
      color: inherit;
      text-decoration: none;
      transition: transform .15s, box-shadow .15s;
    }
    a.gruppo-card.clickable:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0,0,0,.15);
    }
    .more {
      display: inline-block;
      margin-top: .75rem;
      font-size: .9rem;
      font-weight: 600;
      color: var(--color-secondary);
    }
  `],
})
export class GruppiComponent {
  private service = inject(GruppiService);
  private route = inject(ActivatedRoute);

  private readonly gruppi = toSignal(this.service.getAll(), { initialValue: [] });

  // Area selezionata via /gruppi/:area; null su /gruppi (mostra tutte le aree).
  readonly area = toSignal(
    this.route.paramMap.pipe(
      map(p => {
        const a = p.get('area') as AreaGruppo | null;
        return a && AREE.includes(a) ? a : null;
      }),
    ),
    { initialValue: null as AreaGruppo | null },
  );

  readonly aree = computed(() => {
    const order = this.area() ? [this.area()!] : AREE;
    return order
      .map(area => ({
        area,
        gruppi: this.gruppi()
          .filter(g => g.area === area)
          .sort((a, b) => a.ordine - b.ordine),
      }))
      .filter(g => g.gruppi.length > 0);
  });

  label(area: AreaGruppo): string {
    return AREA_LABELS[area];
  }
}
