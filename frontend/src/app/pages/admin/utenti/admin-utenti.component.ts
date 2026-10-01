import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataTableComponent, ColumnDef } from '../../../shared/data-table/data-table.component';
import { UtentiService } from '../../../core/services/utenti.service';
import { AuthService } from '../../../core/services/auth.service';
import { AreaPortale, RUOLI, Ruolo, Utente, etichettaRuolo } from '../../../core/models/utente.model';

interface FormUtente {
  email: string;
  nome: string;
  ruolo: Ruolo;
  aree: string[];
  password: string;
  attivo: boolean;
}

const vuoto = (): FormUtente => ({ email: '', nome: '', ruolo: 'responsabile', aree: [], password: '', attivo: true });

function errore(err: any, fallback: string): string {
  const m = err?.error?.message;
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' && m ? m : fallback;
}

@Component({
  selector: 'app-admin-utenti',
  standalone: true,
  imports: [FormsModule, RouterLink, DataTableComponent],
  template: `
    <div class="container page-content">
      <div class="head">
        <div>
          <a routerLink="/admin" class="back">← Pannello</a>
          <h1>Utenti</h1>
        </div>
        @if (!editing()) {
          <button class="btn btn-primary" (click)="nuovo()">+ Nuovo utente</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
      @if (info()) { <div class="alert alert-ok">{{ info() }}</div> }

      @if (editing()) {
        <form class="card form" (ngSubmit)="salva()" #f="ngForm">
          <h2>{{ editId() ? 'Modifica utente' : 'Nuovo utente' }}</h2>
          <div class="row-2">
            <div class="form-group">
              <label for="nome">Nome e cognome *</label>
              <input id="nome" name="nome" [(ngModel)]="form.nome" required maxlength="120" />
            </div>
            <div class="form-group">
              <label for="email">Email (per l'accesso) *</label>
              <input id="email" name="email" type="email" email [(ngModel)]="form.email" required
                     [disabled]="!!editId()" maxlength="160" />
            </div>
          </div>

          <div class="form-group">
            <label>Ruolo *</label>
            <div class="ruoli">
              @for (r of ruoli; track r.value) {
                <label class="ruolo" [class.scelto]="form.ruolo === r.value">
                  <input type="radio" name="ruolo" [value]="r.value" [(ngModel)]="form.ruolo" (ngModelChange)="pulisciAree()" />
                  <span><strong>{{ r.label }}</strong><small>{{ r.descrizione }}</small></span>
                </label>
              }
            </div>
          </div>

          @if (conAree()) {
            <div class="form-group">
              <label>Aree assegnate *</label>
              <p class="hint">{{ form.ruolo === 'responsabile'
                ? 'Pubblica direttamente pagina ed eventi di queste aree e approva i contributor.'
                : 'Le modifiche su queste aree andranno approvate dal responsabile.' }}</p>
              @for (g of gruppiAree(); track g.nome) {
                <fieldset>
                  <legend>{{ g.nome }}</legend>
                  <div class="aree">
                    @for (a of g.aree; track a.chiave) {
                      <label class="check" [class.off]="a.chiave === 'grest' && form.ruolo === 'contributor'">
                        <input type="checkbox" [checked]="form.aree.includes(a.chiave)"
                               [disabled]="a.chiave === 'grest' && form.ruolo === 'contributor'"
                               (change)="toggleArea(a.chiave)" />
                        {{ a.nome }}
                      </label>
                    }
                  </div>
                </fieldset>
              }
              @if (form.ruolo === 'contributor') {
                <span class="hint">L'area Grest si assegna solo ai Responsabili.</span>
              }
            </div>
          }

          @if (!editId()) {
            <div class="form-group pwd">
              <label for="password">Password iniziale * (almeno 8 caratteri)</label>
              <input id="password" name="password" type="text" [(ngModel)]="form.password" required minlength="8"
                     autocomplete="new-password" />
              <span class="hint">Comunicala all'utente: potrà cambiarla da "Il mio profilo".</span>
            </div>
          } @else {
            <label class="check">
              <input type="checkbox" name="attivo" [(ngModel)]="form.attivo" />
              Account attivo (se disattivato non può più accedere)
            </label>
          }

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving() || !f.valid || (conAree() && !form.aree.length)">
              {{ saving() ? 'Salvataggio…' : 'Salva' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="annulla()">Annulla</button>
          </div>
        </form>
      } @else {
        <app-data-table
          [columns]="columns"
          [rows]="utenti()"
          [actions]="azioni"
          [initialSort]="{ key: 'nome', dir: 'asc' }"
          searchPlaceholder="Cerca per nome, email, ruolo, area…"
        />
        <ng-template #azioni let-u>
          <button class="link" (click)="modifica(u)">Modifica</button>
          <button class="link" (click)="nuovaPassword(u)">Password</button>
          @if (u._id !== auth.me()?.userId) {
            <button class="link danger" (click)="elimina(u)">Elimina</button>
          }
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
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
    @media (max-width: 640px) { .row-2 { grid-template-columns: 1fr; } }
    .ruoli { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .6rem; }
    .ruolo { display: flex !important; gap: .6rem; align-items: flex-start; border: 1px solid var(--color-border);
             border-radius: var(--radius); padding: .7rem .8rem; cursor: pointer; font-weight: 400 !important; }
    .ruolo.scelto { border-color: var(--color-primary); background: var(--color-bg-alt); }
    .ruolo input { width: auto !important; margin-top: .2rem; }
    .ruolo small { display: block; color: var(--color-text-muted); font-size: .8rem; margin-top: .15rem; }
    fieldset { border: 1px solid var(--color-border); border-radius: var(--radius); padding: .5rem 1rem .75rem; margin: 0 0 .75rem; }
    legend { font-weight: 700; color: var(--color-primary-dark); padding: 0 .35rem; font-size: .9rem; }
    .aree { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .25rem 1rem; }
    .check { display: flex !important; align-items: center; gap: .5rem; font-weight: 400 !important; margin: .25rem 0; }
    .check input { width: auto !important; }
    .check.off { opacity: .5; }
    .hint { display: block; font-size: .8rem; color: var(--color-text-muted); margin: .1rem 0 .5rem; }
    .pwd { max-width: 380px; }
    .form-actions { display: flex; gap: .75rem; margin-top: 1rem; }
    .alert-ok { background: #e7f6ec; color: #166534; border: 1px solid #86efac; }
    .link { background: none; border: none; color: var(--color-primary); cursor: pointer; padding: 0 .4rem; font-size: .85rem; }
    .link:hover { text-decoration: underline; }
    .link.danger { color: #b91c1c; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
  `],
})
export class AdminUtentiComponent {
  private service = inject(UtentiService);
  protected auth = inject(AuthService);

  readonly ruoli = RUOLI;
  readonly utenti = signal<Utente[]>([]);
  readonly areeDisponibili = signal<AreaPortale[]>([]);
  readonly editing = signal(false);
  readonly editId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly info = signal('');
  form: FormUtente = vuoto();

  readonly gruppiAree = computed(() => {
    const gruppi: { nome: string; aree: AreaPortale[] }[] = [];
    for (const a of this.areeDisponibili()) {
      let g = gruppi.find((x) => x.nome === a.gruppo);
      if (!g) gruppi.push((g = { nome: a.gruppo, aree: [] }));
      g.aree.push(a);
    }
    return gruppi;
  });

  private nomeArea = (k: string) => this.areeDisponibili().find((a) => a.chiave === k)?.nome ?? k;

  readonly columns: ColumnDef<Utente>[] = [
    { key: 'nome', label: 'Nome', value: (u) => u.nome || u.email },
    { key: 'email', label: 'Email', value: (u) => u.email },
    { key: 'ruolo', label: 'Ruolo', value: (u) => etichettaRuolo(u.ruolo) },
    { key: 'aree', label: 'Aree', sortable: false, value: (u) => (u.aree ?? []).map(this.nomeArea).join(', ') || '—' },
    { key: 'attivo', label: 'Stato', type: 'badge', value: (u) => u.attivo !== false,
      badgeLabel: (u) => (u.attivo !== false ? 'Attivo' : 'Disattivato'), badgeOn: (u) => u.attivo !== false },
  ];

  constructor() {
    this.service.aree().subscribe((a) => this.areeDisponibili.set(a));
    this.ricarica();
  }

  conAree(): boolean {
    return this.form.ruolo === 'responsabile' || this.form.ruolo === 'contributor';
  }

  pulisciAree(): void {
    if (!this.conAree()) this.form.aree = [];
    if (this.form.ruolo === 'contributor') this.form.aree = this.form.aree.filter((a) => a !== 'grest');
  }

  toggleArea(chiave: string): void {
    const a = this.form.aree;
    this.form.aree = a.includes(chiave) ? a.filter((x) => x !== chiave) : [...a, chiave];
  }

  private ricarica(): void {
    this.service.elenco().subscribe({
      next: (l) => this.utenti.set(l),
      error: () => this.error.set('Impossibile caricare gli utenti.'),
    });
  }

  nuovo(): void {
    this.form = vuoto();
    this.editId.set(null);
    this.editing.set(true);
    this.error.set('');
    this.info.set('');
  }

  modifica(u: Utente): void {
    this.form = { email: u.email, nome: u.nome ?? '', ruolo: u.ruolo, aree: [...(u.aree ?? [])], password: '', attivo: u.attivo !== false };
    this.editId.set(u._id);
    this.editing.set(true);
    this.error.set('');
    this.info.set('');
  }

  annulla(): void {
    this.editing.set(false);
    this.error.set('');
  }

  salva(): void {
    this.saving.set(true);
    this.error.set('');
    const id = this.editId();
    const { email, nome, ruolo, aree, password, attivo } = this.form;
    const req = id
      ? this.service.modifica(id, { nome, ruolo, aree, attivo })
      : this.service.crea({ email, nome, ruolo, aree, password });
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.info.set(id ? 'Utente aggiornato.' : `Utente creato: comunica a ${email} la password iniziale.`);
        this.ricarica();
        // se ho modificato me stesso aggiorno il profilo (ruolo/aree)
        if (id === this.auth.me()?.userId) this.auth.caricaMe().subscribe();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(errore(err, 'Salvataggio non riuscito.'));
      },
    });
  }

  nuovaPassword(u: Utente): void {
    const password = prompt(`Nuova password per ${u.nome || u.email} (almeno 8 caratteri):`);
    if (password === null) return;
    this.error.set('');
    this.info.set('');
    this.service.impostaPassword(u._id, password).subscribe({
      next: () => this.info.set(`Password di ${u.nome || u.email} aggiornata: comunicagliela.`),
      error: (err) => this.error.set(errore(err, 'Cambio password non riuscito.')),
    });
  }

  elimina(u: Utente): void {
    if (!confirm(`Eliminare l'utente ${u.nome || u.email}? Non potrà più accedere.`)) return;
    this.error.set('');
    this.service.elimina(u._id).subscribe({
      next: () => this.ricarica(),
      error: (err) => this.error.set(errore(err, 'Eliminazione non riuscita.')),
    });
  }
}
