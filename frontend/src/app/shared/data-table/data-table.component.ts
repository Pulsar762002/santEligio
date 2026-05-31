import { Component, Input, TemplateRef, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type SortDir = 'asc' | 'desc';

export interface ColumnDef<T = any> {
  key: string;                 // chiave univoca / chiave di ordinamento
  label: string;               // intestazione
  sortable?: boolean;          // default true
  filterable?: boolean;        // default true (escluso da ricerca se false)
  type?: 'text' | 'number' | 'date' | 'image' | 'badge';
  align?: 'left' | 'center' | 'right';
  width?: string;              // es. "64px"
  value?: (row: T) => string | number | boolean | null | undefined; // per sort/filter
  display?: (row: T) => string;        // testo mostrato (default: value)
  imageUrl?: (row: T) => string;       // per type 'image'
  badgeLabel?: (row: T) => string;     // per type 'badge'
  badgeOn?: (row: T) => boolean;       // per type 'badge' (evidenziato)
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    <div class="toolbar">
      <input
        class="search"
        type="search"
        [placeholder]="searchPlaceholder"
        [value]="search()"
        (input)="search.set($any($event.target).value)"
      />
      <span class="count">{{ view().length }} / {{ rows.length }}</span>
    </div>

    <table class="grid">
      <thead>
        <tr>
          @for (c of columns; track c.key) {
            <th
              [style.width]="c.width || null"
              [class.sortable]="c.sortable !== false"
              [class.active]="sortKey() === c.key"
              [style.text-align]="c.align || 'left'"
              (click)="toggleSort(c)"
            >
              {{ c.label }}
              @if (c.sortable !== false) {
                <span class="arrow">{{ sortKey() === c.key ? (sortDir() === 'asc' ? '▲' : '▼') : '↕' }}</span>
              }
            </th>
          }
          @if (actions) { <th></th> }
        </tr>
      </thead>
      <tbody>
        @for (row of view(); track row[trackBy]) {
          <tr>
            @for (c of columns; track c.key) {
              <td [style.text-align]="c.align || 'left'">
                @switch (c.type) {
                  @case ('image') {
                    @if (c.imageUrl && c.imageUrl(row)) {
                      <img class="thumb" [src]="c.imageUrl(row)" [alt]="''" />
                    } @else {
                      <span class="thumb placeholder">—</span>
                    }
                  }
                  @case ('badge') {
                    <span class="badge" [class.on]="c.badgeOn && c.badgeOn(row)">{{ c.badgeLabel ? c.badgeLabel(row) : text(c, row) }}</span>
                  }
                  @default {
                    {{ text(c, row) }}
                  }
                }
              </td>
            }
            @if (actions) {
              <td class="actions">
                <ng-container *ngTemplateOutlet="actions; context: { $implicit: row }"></ng-container>
              </td>
            }
          </tr>
        }
        @if (view().length === 0) {
          <tr><td [attr.colspan]="columns.length + (actions ? 1 : 0)" class="no-rows">Nessun risultato.</td></tr>
        }
      </tbody>
    </table>
  `,
  styles: [`
    :host { display: block; }
    .toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: .75rem; }
    .search {
      flex: 0 1 320px;
      padding: .5rem .75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      font-family: var(--font-body);
      font-size: .9rem;
      background: white;
    }
    .search:focus { outline: 2px solid var(--color-secondary); border-color: var(--color-secondary); }
    .count { font-size: .8rem; color: var(--color-text-muted); }

    .grid { width: 100%; border-collapse: collapse; background: white; border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
    .grid th, .grid td { text-align: left; padding: .75rem 1rem; border-bottom: 1px solid var(--color-border); font-size: .9rem; vertical-align: middle; }
    .grid th { background: var(--color-bg-alt); font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; color: var(--color-text-muted); white-space: nowrap; user-select: none; }
    .grid th.sortable { cursor: pointer; }
    .grid th.sortable:hover { color: var(--color-primary); }
    .grid th.active { color: var(--color-primary); }
    .arrow { font-size: .7rem; margin-left: .3rem; opacity: .7; }
    .grid tr:last-child td { border-bottom: none; }
    .no-rows { text-align: center; color: var(--color-text-muted); font-style: italic; }

    .thumb { display: block; width: 48px; height: 48px; border-radius: 6px; object-fit: cover; border: 1px solid var(--color-border); }
    .thumb.placeholder { display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); background: var(--color-bg-alt); }
    .badge { font-size: .75rem; padding: .15rem .5rem; border-radius: 999px; background: var(--color-bg-alt); color: var(--color-text-muted); border: 1px solid var(--color-border); white-space: nowrap; }
    .badge.on { background: color-mix(in srgb, var(--color-primary) 12%, white); color: var(--color-primary-dark); border-color: color-mix(in srgb, var(--color-primary) 35%, white); }
    .actions { white-space: nowrap; }
  `],
})
export class DataTableComponent<T extends Record<string, any> = any> {
  @Input({ required: true }) columns: ColumnDef<T>[] = [];
  @Input({ required: true }) set rows(v: T[]) { this._rows.set(v ?? []); }
  get rows(): T[] { return this._rows(); }
  @Input() actions?: TemplateRef<{ $implicit: T }>;
  @Input() trackBy = '_id';
  @Input() searchPlaceholder = 'Cerca…';
  @Input() initialSort?: { key: string; dir?: SortDir };

  private readonly _rows = signal<T[]>([]);
  readonly search = signal('');
  readonly sortKey = signal<string | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  ngOnInit(): void {
    if (this.initialSort) {
      this.sortKey.set(this.initialSort.key);
      this.sortDir.set(this.initialSort.dir ?? 'asc');
    }
  }

  readonly view = computed<T[]>(() => {
    let rows = this._rows();

    const q = this.search().trim().toLowerCase();
    if (q) {
      rows = rows.filter(row =>
        this.columns
          .filter(c => c.filterable !== false && c.type !== 'image')
          .some(c => this.text(c, row).toLowerCase().includes(q)),
      );
    }

    const key = this.sortKey();
    if (key) {
      const col = this.columns.find(c => c.key === key);
      if (col) {
        const dir = this.sortDir() === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => dir * this.compare(this.sortVal(col, a), this.sortVal(col, b)));
      }
    }
    return rows;
  });

  toggleSort(col: ColumnDef<T>): void {
    if (col.sortable === false) return;
    if (this.sortKey() === col.key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(col.key);
      this.sortDir.set('asc');
    }
  }

  private sortVal(col: ColumnDef<T>, row: T): string | number | boolean | null | undefined {
    return col.value ? col.value(row) : row[col.key];
  }

  text(col: ColumnDef<T>, row: T): string {
    if (col.display) return col.display(row) ?? '';
    if (col.type === 'badge' && col.badgeLabel) return col.badgeLabel(row) ?? '';
    const v = this.sortVal(col, row);
    return v == null ? '' : String(v);
  }

  private compare(a: any, b: any): number {
    const aEmpty = a == null || a === '';
    const bEmpty = b == null || b === '';
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return -1;
    if (bEmpty) return 1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;
    return String(a).localeCompare(String(b), 'it', { numeric: true, sensitivity: 'base' });
  }
}
