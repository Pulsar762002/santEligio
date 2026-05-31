import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { StradarioService } from '../../core/services/stradario.service';
import { Strada } from '../../core/models/strada.model';

interface GruppoContrada {
  contrada: string;
  vie: string[];
}

@Component({
  selector: 'app-stradario',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page-content">
      <header class="page-head">
        <a routerLink="/parrocchia" class="back">&larr; La Parrocchia</a>
        <h1>Stradario del territorio parrocchiale</h1>
        <p class="subtitle">Il territorio è suddiviso in contrade. Di seguito le vie appartenenti a ciascuna.</p>
      </header>

      @if (gruppi().length > 0) {
        <div class="contrade">
          @for (g of gruppi(); track g.contrada) {
            <section class="contrada">
              <h2>{{ g.contrada }} <span class="conteggio">{{ g.vie.length }}</span></h2>
              <ul>
                @for (via of g.vie; track via) {
                  <li>{{ via }}</li>
                }
              </ul>
            </section>
          }
        </div>
      } @else {
        <p class="empty">Stradario non disponibile.</p>
      }
    </div>
  `,
  styles: [`
    .page-head { margin-bottom: 1.75rem; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .page-head h1 { margin: 0 0 .25rem; }
    .subtitle { color: var(--color-text-muted); font-size: 1.05rem; margin: 0; }

    .contrade {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      align-items: start;
    }
    @media (max-width: 900px) { .contrade { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .contrade { grid-template-columns: 1fr; } }
    .contrada {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      border-top: 4px solid var(--color-primary);
      padding: 1.25rem 1.5rem;
    }
    .contrada h2 {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: 1.25rem;
      margin: 0 0 .85rem;
    }
    .conteggio {
      font-size: .75rem;
      font-weight: 700;
      color: var(--color-primary-dark);
      background: color-mix(in srgb, var(--color-primary) 12%, white);
      border: 1px solid color-mix(in srgb, var(--color-primary) 30%, white);
      border-radius: 999px;
      padding: .05rem .5rem;
    }
    .contrada ul { list-style: none; margin: 0; padding: 0; }
    .contrada li {
      padding: .35rem 0;
      border-bottom: 1px solid var(--color-bg-alt);
      font-size: .95rem;
    }
    .contrada li:last-child { border-bottom: none; }
  `],
})
export class StradarioComponent {
  private service = inject(StradarioService);
  private readonly strade = toSignal(this.service.getAll(), { initialValue: [] as Strada[] });

  readonly gruppi = computed<GruppoContrada[]>(() => {
    const map = new Map<string, string[]>();
    for (const s of this.strade()) {
      (map.get(s.contrada) ?? map.set(s.contrada, []).get(s.contrada)!).push(s.via);
    }
    return [...map.entries()]
      .map(([contrada, vie]) => ({ contrada, vie }))
      .sort((a, b) => a.contrada.localeCompare(b.contrada, 'it'));
  });
}
