import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrariMesseService } from '../../core/services/orari-messe.service';
import { TipoMessa } from '../../core/models/orario-messa.model';

@Component({
  selector: 'app-orari-messe',
  standalone: true,
  template: `
    <div class="container page-content">
      <h1>Orari delle Messe</h1>

      @for (gruppo of gruppi(); track gruppo.tipo) {
        <section class="gruppo">
          <h2>{{ labelTipo(gruppo.tipo) }}</h2>
          <table class="orari-table">
            <thead>
              <tr>
                <th>Giorno</th>
                <th>Ora</th>
                @if (haChiese()) { <th>Chiesa</th> }
                @if (haNote()) { <th>Note</th> }
              </tr>
            </thead>
            <tbody>
              @for (orario of gruppo.orari; track orario._id) {
                <tr>
                  <td>{{ orario.giorno }}</td>
                  <td class="ora">{{ orario.ora }}</td>
                  @if (haChiese()) { <td>{{ orario.chiesa ?? '' }}</td> }
                  @if (haNote()) { <td class="note">{{ orario.note ?? '' }}</td> }
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      @if (!gruppi() || gruppi()!.length === 0) {
        <p class="empty">Nessun orario disponibile.</p>
      }
    </div>
  `,
  styles: [`
    .gruppo { margin-bottom: 2.5rem; }
    .orari-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    th {
      background: var(--color-bg-alt);
      color: var(--color-primary);
      font-family: var(--font-heading);
      padding: .65rem 1rem;
      text-align: left;
      font-size: .9rem;
      border-bottom: 1px solid var(--color-border);
    }
    td {
      padding: .6rem 1rem;
      border-bottom: 1px solid var(--color-border);
      font-size: .95rem;
    }
    tr:last-child td { border-bottom: none; }
    .ora { font-weight: 700; color: var(--color-primary); }
    .note { color: var(--color-text-muted); font-size: .85rem; }
  `],
})
export class OrariMesseComponent {
  private orariService = inject(OrariMesseService);

  private readonly orari = toSignal(this.orariService.getAll(), { initialValue: [] });

  readonly gruppi = computed(() => {
    const order: TipoMessa[] = ['festiva', 'prefestiva', 'feriale'];
    return order
      .map(tipo => ({ tipo, orari: this.orari().filter(o => o.tipo === tipo) }))
      .filter(g => g.orari.length > 0);
  });

  haChiese(): boolean {
    return this.orari().some(o => !!o.chiesa);
  }

  haNote(): boolean {
    return this.orari().some(o => !!o.note);
  }

  labelTipo(tipo: TipoMessa): string {
    const labels: Record<TipoMessa, string> = {
      festiva: 'Messe Festive (Domenica e Festivi)',
      prefestiva: 'Messe Prefestive (Sabato sera)',
      feriale: 'Messe Feriali',
    };
    return labels[tipo];
  }
}
