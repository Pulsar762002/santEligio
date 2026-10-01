import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AreeService } from '../../../core/services/aree.service';
import { AuthService } from '../../../core/services/auth.service';
import { AreaMia } from '../../../core/models/area.model';

@Component({
  selector: 'app-admin-aree',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page-content">
      <a routerLink="/admin" class="back">← Pannello</a>
      <h1>{{ auth.isAdmin() ? 'Aree' : 'Le mie aree' }}</h1>
      <p class="muted">
        @if (auth.ruolo() === 'contributor') {
          Le tue modifiche vengono inviate al responsabile dell'area e compaiono sul sito dopo la sua approvazione.
        } @else {
          Modifica la pagina dell'area e gestisci i suoi eventi: le modifiche sono pubblicate subito.
        }
      </p>

      @if (aree() === null) {
        <p class="empty">Caricamento…</p>
      } @else if (!aree()!.length) {
        <p class="empty">Nessuna area assegnata al tuo account: chiedi all'amministratore.</p>
      }

      @for (g of gruppi(); track g.nome) {
        <h2 class="gruppo">{{ g.nome }}</h2>
        <div class="griglia">
          @for (a of g.aree; track a.chiave) {
            <div class="area">
              <div class="testa">
                <h3>{{ a.nome }}</h3>
                @if (a.propostePendenti) {
                  <a routerLink="/admin/approvazioni" class="pendenti">{{ a.propostePendenti }} in attesa</a>
                }
              </div>
              @if (a.tipo === 'grest') {
                <p class="stato">Iscritti, moduli e accesso delle famiglie.</p>
                <div class="azioni">
                  <a routerLink="/admin/grest" class="btn btn-primary">Gestisci il Grest</a>
                </div>
              } @else {
                <p class="stato">
                  @if (!a.esiste) { <span class="no">Pagina non ancora creata</span> }
                  @else if (!a.pubblicato) { <span class="no">Pagina non pubblicata</span> }
                  @else { <span class="si">Pagina online</span> }
                </p>
                <div class="azioni">
                  <a [routerLink]="['/admin/aree', a.chiave]" class="btn btn-primary">Pagina</a>
                  <a routerLink="/admin/eventi" [queryParams]="{ area: a.chiave }" class="btn btn-outline">Eventi ({{ a.eventi }})</a>
                  @if (a.esiste) { <a [routerLink]="a.link" class="btn btn-outline">Vedi sul sito</a> }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .back { display: inline-block; font-size: .85rem; margin-bottom: .35rem; }
    h1 { margin: 0 0 .25rem; }
    .muted { color: var(--color-text-muted); margin: 0 0 1.5rem; max-width: 760px; }
    .gruppo { font-size: 1rem; color: var(--color-primary-dark); margin: 1.5rem 0 .75rem; text-transform: uppercase; letter-spacing: .04em; }
    .griglia { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .area { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.1rem 1.25rem; }
    .testa { display: flex; justify-content: space-between; align-items: baseline; gap: .5rem; }
    .area h3 { margin: 0; font-size: 1.05rem; }
    .pendenti { font-size: .75rem; background: #fef3c7; color: #92400e; border-radius: 999px; padding: .1rem .55rem; white-space: nowrap; }
    .stato { font-size: .85rem; margin: .4rem 0 .9rem; color: var(--color-text-muted); }
    .si { color: #166534; }
    .no { color: #b45309; }
    .azioni { display: flex; gap: .5rem; flex-wrap: wrap; }
    .azioni .btn { padding: .4rem .9rem; font-size: .85rem; }
  `],
})
export class AdminAreeComponent {
  protected auth = inject(AuthService);
  readonly aree = toSignal(inject(AreeService).mie().pipe(catchError(() => of([] as AreaMia[]))), {
    initialValue: null,
  });

  readonly gruppi = computed(() => {
    const out: { nome: string; aree: AreaMia[] }[] = [];
    for (const a of this.aree() ?? []) {
      let g = out.find((x) => x.nome === a.gruppo);
      if (!g) out.push((g = { nome: a.gruppo, aree: [] }));
      g.aree.push(a);
    }
    return out;
  });
}
