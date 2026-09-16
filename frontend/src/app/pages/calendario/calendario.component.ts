import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CalendarioAttivitaService } from '../../core/services/calendario-attivita.service';
import { CalendarioPdfService, GiornoAgenda } from '../../core/services/calendario-pdf.service';
import {
  CalendarioAttivita, TipoAttivita, TIPO_ATTIVITA_LABEL, ColoreAttivita, COLORE_ATTIVITA_HEX,
} from '../../core/models/calendario-attivita.model';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="container page-content">
      <div class="page-header">
        <h1>Calendario delle Attività</h1>
        <div class="month-nav">
          <button class="nav-btn" (click)="meseFa()" aria-label="Mese precedente">&larr;</button>
          <span class="month-label">{{ meseLabel() }}</span>
          <button class="nav-btn" (click)="meseAvanti()" aria-label="Mese successivo">&rarr;</button>
        </div>
        <button class="btn-pdf" (click)="scaricaPdf()" [disabled]="loading()">
          ⬇ Scarica PDF del mese
        </button>
      </div>

      @if (loading()) {
        <p class="empty">Caricamento…</p>
      } @else if (giorni().length === 0) {
        <p class="empty">Nessuna attività in programma per questo mese.</p>
      } @else {
        @for (giorno of giorni(); track giorno.data) {
          <section class="giorno">
            <h2>{{ giorno.data | date: 'EEEE d MMMM' }}</h2>
            <ul class="voci">
              @for (v of giorno.voci; track v._id) {
                <li class="voce">
                  <span class="ora">{{ v.ora }}</span>
                  <span class="dettagli">
                    <span class="titolo"
                          [style.color]="coloreHex(v.colore)"
                          [style.font-weight]="v.grassetto ? 'bold' : null"
                          [style.font-style]="v.corsivo ? 'italic' : null">{{ titoloTipo(v.tipo) }}: {{ v.titolo }}</span>
                    @if (v.luogo) { <span class="luogo">{{ v.luogo }}</span> }
                    @if (v.note) { <span class="note">{{ v.note }}</span> }
                  </span>
                </li>
              }
            </ul>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.75rem; }
    .page-header h1 { margin: 0; }
    .month-nav { display: flex; align-items: center; gap: .75rem; }
    .month-label { font-weight: 600; min-width: 12ch; text-align: center; text-transform: capitalize; }
    .nav-btn {
      width: 2.25rem; height: 2.25rem; border-radius: 50%;
      border: 1px solid var(--color-border); background: white; cursor: pointer;
      font-size: 1rem; line-height: 1; color: var(--color-primary);
    }
    .nav-btn:hover { background: var(--color-bg-alt); }
    .btn-pdf {
      padding: .55rem 1.1rem; border-radius: var(--radius); border: none;
      background: var(--color-primary); color: white;
      font-size: .9rem; font-weight: 600; cursor: pointer;
      transition: background .15s;
    }
    .btn-pdf:hover:not(:disabled) { background: var(--color-primary-dark); }
    .btn-pdf:disabled { opacity: .6; cursor: default; }
    .empty { color: var(--color-text-muted); font-style: italic; }
    .giorno { margin-bottom: 2rem; }
    .giorno h2 {
      font-size: 1.05rem; color: var(--color-primary); text-transform: capitalize;
      border-bottom: 1px solid var(--color-border); padding-bottom: .4rem; margin-bottom: .75rem;
    }
    .voci { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
    .voce {
      display: flex; gap: 1rem; align-items: baseline;
      background: white; border: 1px solid var(--color-border); border-radius: var(--radius);
      padding: .65rem 1rem;
    }
    .ora { font-weight: 700; color: var(--color-primary); min-width: 4.5ch; }
    .dettagli { display: flex; flex-direction: column; gap: .15rem; }
    .titolo { font-weight: 600; }
    .luogo, .note { font-size: .82rem; color: var(--color-text-muted); }
  `],
})
export class CalendarioComponent {
  private service = inject(CalendarioAttivitaService);
  private pdfService = inject(CalendarioPdfService);
  private dp = new DatePipe('it');

  private readonly oggiData = new Date();
  readonly anno = signal(this.oggiData.getFullYear());
  readonly mese = signal(this.oggiData.getMonth() + 1);
  readonly voci = signal<CalendarioAttivita[]>([]);
  readonly loading = signal(true);

  readonly meseLabel = computed(() => {
    const d = new Date(this.anno(), this.mese() - 1, 1);
    return this.dp.transform(d, 'MMMM yyyy') ?? '';
  });

  readonly giorni = computed<GiornoAgenda[]>(() => {
    const mappa = new Map<string, CalendarioAttivita[]>();
    for (const v of this.voci()) {
      const chiave = v.data.slice(0, 10);
      if (!mappa.has(chiave)) mappa.set(chiave, []);
      mappa.get(chiave)!.push(v);
    }
    return [...mappa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, voci]) => ({ data, voci: voci.sort((a, b) => a.ora.localeCompare(b.ora)) }));
  });

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.loading.set(true);
    this.service.getAll(this.anno(), this.mese()).subscribe({
      next: list => {
        this.voci.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  meseFa(): void {
    this.spostaMese(-1);
  }

  meseAvanti(): void {
    this.spostaMese(1);
  }

  private spostaMese(delta: number): void {
    const d = new Date(this.anno(), this.mese() - 1 + delta, 1);
    this.anno.set(d.getFullYear());
    this.mese.set(d.getMonth() + 1);
    this.ricarica();
  }

  titoloTipo(t: TipoAttivita): string {
    return TIPO_ATTIVITA_LABEL[t] ?? t;
  }

  coloreHex(c?: ColoreAttivita): string {
    return COLORE_ATTIVITA_HEX[c ?? 'nero'];
  }

  scaricaPdf(): void {
    this.pdfService.genera(this.anno(), this.mese(), this.giorni());
  }
}
