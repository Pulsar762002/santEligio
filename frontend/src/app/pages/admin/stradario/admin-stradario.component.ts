import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StradarioService } from '../../../core/services/stradario.service';
import { Strada, Contrada, CONTRADE } from '../../../core/models/strada.model';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

interface StradaForm {
  contrada: Contrada | '';
  via: string;
  ordine: number;
}

function emptyForm(): StradaForm {
  return { contrada: '', via: '', ordine: 0 };
}

@Component({
  selector: 'app-admin-stradario',
  standalone: true,
  imports: [RouterLink, FormsModule, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Stradario</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuova via</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica via' : 'Nuova via' }}</h2>

          <div class="row">
            <div class="form-group">
              <label for="contrada">Contrada *</label>
              <select id="contrada" name="contrada" [(ngModel)]="form.contrada" required>
                <option value="" disabled>— Seleziona —</option>
                @for (c of contrade; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label for="ordine">Ordine</label>
              <input id="ordine" name="ordine" type="number" [(ngModel)]="form.ordine" />
            </div>
          </div>

          <div class="form-group">
            <label for="via">Via *</label>
            <input id="via" name="via" [(ngModel)]="form.via" required placeholder="es. Via Roma" />
          </div>

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
          [rows]="strade()"
          [actions]="azioni"
          [initialSort]="{ key: 'contrada', dir: 'asc' }"
          searchPlaceholder="Cerca via o contrada…"
        />
        <ng-template #azioni let-s>
          <button class="link" (click)="modifica(s)">Modifica</button>
          <button class="link danger" (click)="elimina(s)">Elimina</button>
        </ng-template>
      }
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    .head h1 { margin: 0; }
    .card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.75rem; }
    .form h2 { margin-top: 0; font-size: 1.2rem; }
    .row { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: .75rem; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminStradarioComponent {
  private service = inject(StradarioService);

  readonly strade = signal<Strada[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  form: StradaForm = emptyForm();

  readonly contrade = CONTRADE;

  readonly columns: ColumnDef<Strada>[] = [
    { key: 'contrada', label: 'Contrada', value: s => s.contrada },
    { key: 'via', label: 'Via', value: s => s.via },
    { key: 'ordine', label: 'Ordine', type: 'number', value: s => s.ordine },
  ];

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll().subscribe({
      next: list => this.strade.set(list),
      error: () => this.error.set('Impossibile caricare lo stradario.'),
    });
  }

  nuovo(): void {
    this.form = emptyForm();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(s: Strada): void {
    this.form = { contrada: s.contrada, via: s.via, ordine: s.ordine };
    this.editId.set(s._id);
    this.editing.set(true);
    this.error.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  salva(): void {
    this.error.set('');
    if (!this.form.contrada) { this.error.set('La contrada è obbligatoria.'); return; }
    if (!this.form.via.trim()) { this.error.set('La via è obbligatoria.'); return; }

    const payload: Partial<Strada> = {
      contrada: this.form.contrada,
      via: this.form.via.trim(),
      ordine: Number(this.form.ordine) || 0,
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
        this.error.set(msg ? `Salvataggio non riuscito: ${msg}` : 'Salvataggio non riuscito. Riprova.');
      },
    });
  }

  elimina(s: Strada): void {
    if (!confirm(`Eliminare "${s.via}" (${s.contrada})?`)) return;
    this.service.remove(s._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
