import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarioAttivitaService } from '../../../core/services/calendario-attivita.service';
import {
  CalendarioAttivita, TipoAttivita, TIPI_ATTIVITA, TIPO_ATTIVITA_LABEL, FONTE_ATTIVITA_LABEL,
} from '../../../core/models/calendario-attivita.model';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

interface AttivitaForm {
  data: string; // input date: YYYY-MM-DD
  ora: string;
  titolo: string;
  tipo: TipoAttivita;
  luogo: string;
  note: string;
  pubblicato: boolean;
}

function emptyForm(): AttivitaForm {
  return { data: '', ora: '', titolo: '', tipo: 'altro', luogo: '', note: '', pubblicato: true };
}

@Component({
  selector: 'app-admin-calendario',
  standalone: true,
  imports: [RouterLink, FormsModule, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Calendario Attività</h1>
        </div>
        @if (!editing()) {
          <div class="head-actions">
            <button class="btn btn-outline" (click)="genera()" [disabled]="generando()">
              {{ generando() ? 'Generazione…' : 'Genera dal mese' }}
            </button>
            <button class="btn btn-primary" (click)="nuovo()">+ Nuovo record</button>
          </div>
        }
      </div>

      @if (!editing()) {
        <div class="month-nav">
          <button class="btn btn-outline" (click)="meseFa()">&larr;</button>
          <span class="month-label">{{ meseLabel() }}</span>
          <button class="btn btn-outline" (click)="meseAvanti()">&rarr;</button>
          <button class="link" (click)="oggi()">Oggi</button>
        </div>
        <p class="hint">
          "Genera dal mese" aggiunge le voci mancanti dagli orari delle messe e dagli eventi pubblicati del mese
          (senza toccare quelle già presenti o modificate a mano). I festivi infrasettimanali vanno aggiunti manualmente.
        </p>
      }

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica voce' : 'Nuova voce' }}</h2>

          @if (editFonte() && editFonte() !== 'manuale') {
            <span class="badge fonte">{{ fonteLabel(editFonte()!) }}</span>
          }

          <div class="row">
            <div class="form-group">
              <label for="data">Data *</label>
              <input id="data" name="data" type="date" [(ngModel)]="form.data" required />
            </div>
            <div class="form-group">
              <label for="ora">Ora *</label>
              <input id="ora" name="ora" [(ngModel)]="form.ora" required placeholder="es. 18:30" />
            </div>
          </div>

          <div class="form-group">
            <label for="titolo">Titolo *</label>
            <input id="titolo" name="titolo" [(ngModel)]="form.titolo" required maxlength="200" />
          </div>

          <div class="row">
            <div class="form-group">
              <label for="tipo">Tipo</label>
              <select id="tipo" name="tipo" [(ngModel)]="form.tipo">
                @for (t of tipi; track t) {
                  <option [value]="t">{{ tipoLabel(t) }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="luogo">Luogo</label>
              <input id="luogo" name="luogo" [(ngModel)]="form.luogo" />
            </div>
          </div>

          <div class="form-group">
            <label for="note">Note</label>
            <textarea id="note" name="note" rows="3" [(ngModel)]="form.note"></textarea>
          </div>

          <label class="check">
            <input type="checkbox" name="pubblicato" [(ngModel)]="form.pubblicato" />
            Pubblicato (visibile sul sito)
          </label>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Salva' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="annulla()" [disabled]="saving()">Annulla</button>
          </div>
        </form>
      } @else {
        <app-data-table
          [columns]="columns"
          [rows]="voci()"
          [actions]="azioni"
          [initialSort]="{ key: 'data', dir: 'asc' }"
          searchPlaceholder="Cerca voci…"
        />
        <ng-template #azioni let-v>
          <button class="link" (click)="modifica(v)">Modifica</button>
          <button class="link danger" (click)="elimina(v)">Elimina</button>
        </ng-template>
      }
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .head-actions { display: flex; gap: .75rem; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .month-nav { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
    .month-label { font-weight: 600; min-width: 12ch; text-align: center; text-transform: capitalize; }
    .hint { font-size: .8rem; color: var(--color-text-muted); margin: 0 0 1.25rem; }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.75rem; }
    .form h2 { margin-top: 0; font-size: 1.2rem; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
    textarea { resize: vertical; }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
    .badge.fonte {
      display: inline-block; font-size: .75rem; padding: .15rem .5rem; border-radius: 999px;
      background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border);
      margin-bottom: 1rem;
    }
  `],
})
export class AdminCalendarioComponent {
  private service = inject(CalendarioAttivitaService);

  readonly voci = signal<CalendarioAttivita[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editFonte = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly generando = signal(false);
  readonly error = signal('');

  private readonly oggiData = new Date();
  readonly anno = signal(this.oggiData.getFullYear());
  readonly mese = signal(this.oggiData.getMonth() + 1); // 1-12

  readonly meseLabel = computed(() => {
    const d = new Date(this.anno(), this.mese() - 1, 1);
    return this.dp.transform(d, 'MMMM yyyy') ?? '';
  });

  form: AttivitaForm = emptyForm();
  tipi = TIPI_ATTIVITA;
  private dp = new DatePipe('it');

  readonly columns: ColumnDef<CalendarioAttivita>[] = [
    { key: 'data', label: 'Data', type: 'date',
      value: v => new Date(v.data).getTime(),
      display: v => this.dp.transform(v.data, 'd MMM yyyy') ?? '' },
    { key: 'ora', label: 'Ora', value: v => v.ora },
    { key: 'titolo', label: 'Titolo', value: v => v.titolo },
    { key: 'tipo', label: 'Tipo', type: 'badge', value: v => v.tipo, badgeLabel: v => this.tipoLabel(v.tipo) },
    { key: 'luogo', label: 'Luogo', value: v => v.luogo ?? '', display: v => v.luogo || '—' },
    { key: 'fonte', label: 'Fonte', type: 'badge', value: v => v.fonte,
      badgeLabel: v => this.fonteLabel(v.fonte), badgeOn: v => v.fonte === 'manuale' },
    { key: 'pubblicato', label: 'Stato', type: 'badge', value: v => v.pubblicato,
      badgeLabel: v => (v.pubblicato ? 'Pubblicato' : 'Bozza'), badgeOn: v => v.pubblicato },
  ];

  constructor() {
    this.ricarica();
  }

  tipoLabel(t: TipoAttivita): string {
    return TIPO_ATTIVITA_LABEL[t] ?? t;
  }

  fonteLabel(f: string): string {
    return FONTE_ATTIVITA_LABEL[f as keyof typeof FONTE_ATTIVITA_LABEL] ?? f;
  }

  private ricarica(): void {
    this.service.getAll(this.anno(), this.mese(), true).subscribe({
      next: list => this.voci.set(list),
      error: () => this.error.set('Impossibile caricare il calendario.'),
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

  oggi(): void {
    this.anno.set(this.oggiData.getFullYear());
    this.mese.set(this.oggiData.getMonth() + 1);
    this.ricarica();
  }

  genera(): void {
    this.generando.set(true);
    this.error.set('');
    this.service.genera(this.anno(), this.mese()).subscribe({
      next: list => {
        this.voci.set(list);
        this.generando.set(false);
      },
      error: () => {
        this.generando.set(false);
        this.error.set('Generazione non riuscita.');
      },
    });
  }

  nuovo(): void {
    this.form = emptyForm();
    this.form.data = this.toDateInput(new Date(this.anno(), this.mese() - 1, this.oggiData.getDate()));
    this.editId.set(null);
    this.editFonte.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(v: CalendarioAttivita): void {
    this.form = {
      data: this.toDateInput(new Date(v.data)),
      ora: v.ora,
      titolo: v.titolo,
      tipo: v.tipo,
      luogo: v.luogo ?? '',
      note: v.note ?? '',
      pubblicato: v.pubblicato,
    };
    this.editId.set(v._id);
    this.editFonte.set(v.fonte);
    this.editing.set(true);
    this.error.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  private toDateInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  salva(): void {
    this.error.set('');

    if (!this.form.data) {
      this.error.set('La data è obbligatoria.');
      return;
    }
    if (!this.form.ora.trim()) {
      this.error.set("L'ora è obbligatoria.");
      return;
    }
    if (!this.form.titolo.trim()) {
      this.error.set('Il titolo è obbligatorio.');
      return;
    }

    const payload: Partial<CalendarioAttivita> = {
      data: this.form.data,
      ora: this.form.ora.trim(),
      titolo: this.form.titolo.trim(),
      tipo: this.form.tipo,
      luogo: this.form.luogo.trim() || undefined,
      note: this.form.note.trim() || undefined,
      pubblicato: this.form.pubblicato,
    };

    this.saving.set(true);
    const id = this.editId();
    const req = id ? this.service.update(id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.ricarica();
      },
      error: (err) => {
        this.saving.set(false);
        const dettaglio = err?.error?.message;
        const msg = Array.isArray(dettaglio) ? dettaglio.join(', ') : dettaglio;
        this.error.set(msg ? `Salvataggio non riuscito: ${msg}` : 'Salvataggio non riuscito. Controlla i campi e riprova.');
      },
    });
  }

  elimina(v: CalendarioAttivita): void {
    if (!confirm(`Eliminare la voce "${v.titolo}" del ${this.dp.transform(v.data, 'd MMM yyyy')}?`)) return;
    this.service.remove(v._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
