import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrariMesseService } from '../../../core/services/orari-messe.service';
import { OrarioMessa, TipoMessa } from '../../../core/models/orario-messa.model';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';

interface OrarioForm {
  giorno: string;
  ora: string;
  tipo: TipoMessa;
  chiesa: string;
  note: string;
  ordine: number;
  attivo: boolean;
}

function emptyForm(): OrarioForm {
  return { giorno: '', ora: '', tipo: 'festiva', chiesa: '', note: '', ordine: 0, attivo: true };
}

const TIPI: TipoMessa[] = ['feriale', 'prefestiva', 'festiva'];

@Component({
  selector: 'app-admin-orari-messe',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, FormsModule, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">&larr; Pannello</a>
          <h1>Gestione Orari Messe</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuovo orario</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()">
          <h2>{{ editId() ? 'Modifica orario' : 'Nuovo orario' }}</h2>

          <div class="row">
            <div class="form-group">
              <label for="giorno">Giorno *</label>
              <input id="giorno" name="giorno" [(ngModel)]="form.giorno" required
                     placeholder="es. Domenica e festivi" />
            </div>
            <div class="form-group">
              <label for="ora">Ora *</label>
              <input id="ora" name="ora" [(ngModel)]="form.ora" required
                     placeholder="es. 11:00 oppure 8:30, 18:30" />
            </div>
          </div>

          <div class="row">
            <div class="form-group">
              <label for="tipo">Tipo *</label>
              <select id="tipo" name="tipo" [(ngModel)]="form.tipo" required>
                @for (t of tipi; track t) {
                  <option [value]="t">{{ t | titlecase }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="ordine">Ordine</label>
              <input id="ordine" name="ordine" type="number" [(ngModel)]="form.ordine" />
            </div>
          </div>

          <div class="form-group">
            <label for="chiesa">Chiesa</label>
            <input id="chiesa" name="chiesa" [(ngModel)]="form.chiesa" />
          </div>

          <div class="form-group">
            <label for="note">Note</label>
            <input id="note" name="note" [(ngModel)]="form.note"
                   placeholder="es. Santa Messa in lingua inglese" />
          </div>

          <label class="check">
            <input type="checkbox" name="attivo" [(ngModel)]="form.attivo" />
            Attivo (visibile sul sito)
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
          [rows]="orari()"
          [actions]="azioni"
          [initialSort]="{ key: 'ordine', dir: 'asc' }"
          searchPlaceholder="Cerca orari…"
        />
        <ng-template #azioni let-o>
          <button class="link" (click)="modifica(o)">Modifica</button>
          <button class="link danger" (click)="elimina(o)">Elimina</button>
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
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 560px) { .row { grid-template-columns: 1fr; } }
    .check { display: flex; align-items: center; gap: .5rem; margin: .5rem 0 1.25rem; font-size: .95rem; }
    .check input { width: auto; }
    .form-actions { display: flex; gap: .75rem; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
  `],
})
export class AdminOrariMesseComponent {
  private service = inject(OrariMesseService);

  readonly orari = signal<OrarioMessa[]>([]);
  readonly editId = signal<string | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  readonly tipi = TIPI;
  form: OrarioForm = emptyForm();
  private tc = new TitleCasePipe();

  readonly columns: ColumnDef<OrarioMessa>[] = [
    { key: 'ordine', label: '#', type: 'number', width: '56px', value: o => o.ordine },
    { key: 'giorno', label: 'Giorno', value: o => o.giorno },
    { key: 'ora', label: 'Ora', value: o => o.ora },
    { key: 'tipo', label: 'Tipo', value: o => o.tipo, display: o => this.tc.transform(o.tipo) },
    { key: 'note', label: 'Note', value: o => o.note ?? '', display: o => o.note || '—' },
    { key: 'attivo', label: 'Stato', type: 'badge', value: o => o.attivo,
      badgeLabel: o => (o.attivo ? 'Attivo' : 'Disattivo'), badgeOn: o => o.attivo },
  ];

  constructor() {
    this.ricarica();
  }

  private ricarica(): void {
    this.service.getAll(undefined, true).subscribe({
      next: list => this.orari.set(list),
      error: () => this.error.set('Impossibile caricare gli orari.'),
    });
  }

  nuovo(): void {
    this.form = emptyForm();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
  }

  modifica(o: OrarioMessa): void {
    this.form = {
      giorno: o.giorno,
      ora: o.ora,
      tipo: o.tipo,
      chiesa: o.chiesa ?? '',
      note: o.note ?? '',
      ordine: o.ordine,
      attivo: o.attivo,
    };
    this.editId.set(o._id);
    this.editing.set(true);
    this.error.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  salva(): void {
    this.error.set('');

    if (!this.form.giorno.trim()) {
      this.error.set('Il giorno è obbligatorio.');
      return;
    }
    if (!this.form.ora.trim()) {
      this.error.set("L'ora è obbligatoria.");
      return;
    }

    const payload: Partial<OrarioMessa> = {
      giorno: this.form.giorno.trim(),
      ora: this.form.ora.trim(),
      tipo: this.form.tipo,
      chiesa: this.form.chiesa.trim() || undefined,
      note: this.form.note.trim() || undefined,
      ordine: Number(this.form.ordine) || 0,
      attivo: this.form.attivo,
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

  elimina(o: OrarioMessa): void {
    if (!confirm(`Eliminare l'orario "${o.giorno} ${o.ora}"?`)) return;
    this.service.remove(o._id).subscribe({
      next: () => this.ricarica(),
      error: () => this.error.set('Eliminazione non riuscita.'),
    });
  }
}
