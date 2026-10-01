import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AreeService } from '../../../core/services/aree.service';
import { AuthService } from '../../../core/services/auth.service';
import { Proposta, StatoProposta } from '../../../core/models/area.model';

const STATI: { id: StatoProposta | ''; label: string }[] = [
  { id: 'in_attesa', label: 'In attesa' },
  { id: 'approvata', label: 'Approvate' },
  { id: 'rifiutata', label: 'Rifiutate' },
  { id: '', label: 'Tutte' },
];

@Component({
  selector: 'app-admin-approvazioni',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container page-content">
      <a routerLink="/admin" class="back">← Pannello</a>
      <h1>{{ auth.puoApprovare() ? 'Approvazioni' : 'Le mie proposte' }}</h1>
      <p class="muted">
        @if (auth.puoApprovare()) {
          Modifiche proposte dai contributor delle tue aree: approvandole vengono pubblicate sul sito.
        } @else {
          Le modifiche che hai inviato e la decisione del responsabile.
        }
      </p>

      <div class="filtri">
        @for (s of stati; track s.id) {
          <button [class.on]="stato() === s.id" (click)="filtra(s.id)">{{ s.label }}</button>
        }
      </div>

      @if (error()) { <div class="alert alert-error">{{ error() }}</div> }

      @if (!proposte().length) {
        <p class="empty">Nessuna proposta{{ stato() === 'in_attesa' ? ' in attesa' : '' }}.</p>
      }

      @for (p of proposte(); track p._id) {
        <article class="proposta">
          <header>
            <div>
              <span class="tipo">{{ descrizione(p) }}</span>
              <h2>{{ p.titolo || '(senza titolo)' }}</h2>
              <p class="meta">
                Area <strong>{{ nomeArea(p.area) }}</strong> · da {{ p.autoreNome }} ·
                {{ p.createdAt | date: 'd MMM yyyy, HH:mm' }}
              </p>
            </div>
            <span class="stato" [class]="p.stato">{{ etichetta(p.stato) }}</span>
          </header>

          <details>
            <summary>Vedi il contenuto proposto</summary>
            @if (p.tipo === 'contenuto') {
              @if (p.dati['sottotitolo']) { <p><em>{{ p.dati['sottotitolo'] }}</em></p> }
              <div class="prosa" [innerHTML]="p.dati['contenuto']"></div>
            } @else {
              <dl>
                <dt>Quando</dt>
                <dd>{{ p.dati['dataInizio'] | date: 'EEE d MMM yyyy, HH:mm' }}
                  @if (p.dati['dataFine']) { – {{ p.dati['dataFine'] | date: 'd MMM yyyy, HH:mm' }} }</dd>
                <dt>Luogo</dt><dd>{{ p.dati['luogo'] || '—' }}</dd>
                <dt>Visibile</dt><dd>{{ p.dati['pubblicato'] === false ? 'No' : 'Sì' }}</dd>
                <dt>Descrizione</dt><dd>{{ p.dati['descrizione'] || '—' }}</dd>
              </dl>
            }
          </details>

          @if (p.stato !== 'in_attesa') {
            <p class="decisione">
              {{ p.stato === 'approvata' ? 'Approvata' : 'Rifiutata' }} da {{ p.decisoDa }}
              il {{ p.decisoIl | date: 'd MMM yyyy, HH:mm' }}
              @if (p.nota) { — <em>{{ p.nota }}</em> }
            </p>
          } @else if (auth.puoApprovare()) {
            <div class="azioni">
              <button class="btn btn-primary" (click)="approva(p)" [disabled]="busy()">Approva e pubblica</button>
              <button class="btn btn-outline" (click)="rifiuta(p)" [disabled]="busy()">Rifiuta</button>
            </div>
          }
        </article>
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    h1 { margin: 0 0 .25rem; }
    .muted { color: var(--color-text-muted); margin: 0 0 1rem; }
    .filtri { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .filtri button { background: white; border: 1px solid var(--color-border); border-radius: 999px; padding: .3rem .9rem;
                     font: inherit; font-size: .85rem; cursor: pointer; }
    .filtri button.on { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    .proposta { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.1rem 1.25rem; margin-bottom: 1rem; }
    header { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .tipo { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; color: var(--color-secondary); font-weight: 700; }
    h2 { margin: .1rem 0; font-size: 1.15rem; }
    .meta { margin: 0; font-size: .85rem; color: var(--color-text-muted); }
    .stato { font-size: .75rem; border-radius: 999px; padding: .15rem .6rem; white-space: nowrap; }
    .stato.in_attesa { background: #fef3c7; color: #92400e; }
    .stato.approvata { background: #e7f6ec; color: #166534; }
    .stato.rifiutata { background: #fde8e8; color: #b91c1c; }
    details { margin: .75rem 0; }
    summary { cursor: pointer; color: var(--color-primary); font-size: .9rem; }
    .prosa, dl { border: 1px dashed var(--color-border); border-radius: var(--radius); padding: .9rem; margin-top: .5rem; background: var(--color-bg); }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: .3rem .9rem; font-size: .9rem; }
    dt { color: var(--color-text-muted); }
    dd { margin: 0; white-space: pre-line; }
    .decisione { font-size: .85rem; color: var(--color-text-muted); margin: .25rem 0 0; }
    .azioni { display: flex; gap: .6rem; flex-wrap: wrap; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
  `],
})
export class AdminApprovazioniComponent {
  private service = inject(AreeService);
  protected auth = inject(AuthService);

  readonly stati = STATI;
  readonly stato = signal<StatoProposta | ''>('in_attesa');
  readonly proposte = signal<Proposta[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly nomi = signal<Record<string, string>>({});

  constructor() {
    this.service.mie().subscribe((aree) => this.nomi.set(Object.fromEntries(aree.map((a) => [a.chiave, a.nome]))));
    this.carica();
  }

  nomeArea = (k: string) => this.nomi()[k] ?? k;
  etichetta = (s: StatoProposta) => ({ in_attesa: 'In attesa', approvata: 'Approvata', rifiutata: 'Rifiutata' })[s];

  descrizione(p: Proposta): string {
    if (p.tipo === 'contenuto') return 'Modifica della pagina';
    return p.azione === 'crea' ? 'Nuovo evento' : 'Modifica evento';
  }

  filtra(s: StatoProposta | ''): void {
    this.stato.set(s);
    this.carica();
  }

  private carica(): void {
    this.service.proposte(this.stato() || undefined).subscribe({
      next: (l) => this.proposte.set(l),
      error: () => this.error.set('Impossibile caricare le proposte.'),
    });
  }

  approva(p: Proposta): void {
    if (!confirm(`Approvare e pubblicare "${p.titolo}"?`)) return;
    this.decidi(this.service.approva(p._id));
  }

  rifiuta(p: Proposta): void {
    const nota = prompt('Motivo del rifiuto (facoltativo, lo vedrà chi ha proposto la modifica):');
    if (nota === null) return;
    this.decidi(this.service.rifiuta(p._id, nota));
  }

  private decidi(req: ReturnType<AreeService['approva']>): void {
    this.busy.set(true);
    this.error.set('');
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.carica();
      },
      error: (err) => {
        this.busy.set(false);
        const m = err?.error?.message;
        this.error.set(typeof m === 'string' ? m : 'Operazione non riuscita.');
      },
    });
  }
}
