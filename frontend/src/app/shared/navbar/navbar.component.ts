import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { PagineService } from '../../core/services/pagine.service';
import { GruppiService } from '../../core/services/gruppi.service';
import { SezionePagina, SEZIONE_LABELS } from '../../core/models/pagina.model';
import { AreaGruppo, AREA_LABELS } from '../../core/models/gruppo.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a routerLink="/" class="brand">
          <img
            src="/assets/santeligio-patrono.jpg"
            alt="Sant'Eligio"
            class="brand-logo"
          />
          <span>Parrocchia Sant'Eligio</span>
        </a>
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
          <li class="has-dropdown">
            <a routerLink="/parrocchia" routerLinkActive="active">La Parrocchia <span class="caret" aria-hidden="true">▾</span></a>
            @if (menuParrocchia().length > 0) {
              <div class="dropdown">
                @for (item of menuParrocchia(); track item.sezione) {
                  <a [routerLink]="item.link" routerLinkActive="active"
                     [routerLinkActiveOptions]="{ exact: true }">{{ label(item.sezione) }}</a>
                }
              </div>
            }
          </li>
          <li><a routerLink="/notizie" routerLinkActive="active">Notizie</a></li>
          <li><a routerLink="/eventi" routerLinkActive="active">Eventi</a></li>
          <li><a routerLink="/orari-messe" routerLinkActive="active">Orari Messe</a></li>
          <li class="has-dropdown">
            <a routerLink="/gruppi" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Gruppi <span class="caret" aria-hidden="true">▾</span></a>
            @if (menuGruppi().length > 0) {
              <div class="dropdown">
                @for (item of menuGruppi(); track item.area) {
                  <a [routerLink]="['/gruppi', item.area]" routerLinkActive="active"
                     [routerLinkActiveOptions]="{ exact: true }">{{ labelArea(item.area) }}</a>
                }
              </div>
            }
          </li>
          <li><a routerLink="/galleria" routerLinkActive="active">Galleria</a></li>
          <li><a routerLink="/intenzioni-preghiera" routerLinkActive="active">Intenzioni</a></li>
          <li><a routerLink="/p/contatti" routerLinkActive="active">Contatti</a></li>
          @if (auth.isAdmin()) {
            <li><a routerLink="/admin" routerLinkActive="active">Admin</a></li>
          }
          @if (auth.isLoggedIn()) {
            <li><button class="btn-logout" (click)="logout()">Esci</button></li>
          }
        </ul>
        <a class="phone" href="tel:+390622261045" aria-label="Chiama la parrocchia">
          <span class="ico" aria-hidden="true">📞</span>
          <span class="num">06 2261045</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: var(--color-primary);
      padding: 0.75rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: white;
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: bold;
      white-space: nowrap;
    }
    .brand:hover { text-decoration: none; }
    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      object-position: 50% 18%;
      border: 2px solid rgba(255,255,255,.85);
      flex: 0 0 auto;
    }
    .nav-links {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin: 0 0 0 auto;
      padding: 0;
    }
    .phone {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      flex: 0 0 auto;
      background: rgba(255,255,255,.14);
      border: 1px solid rgba(255,255,255,.35);
      color: white;
      padding: .3rem .8rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: .95rem;
      white-space: nowrap;
      transition: background .15s;
    }
    .phone:hover { background: rgba(255,255,255,.28); text-decoration: none; }
    .phone .ico { font-size: .9rem; }
    .nav-links a {
      color: rgba(255,255,255,.8);
      font-size: 1.05rem;
      font-weight: 500;
      transition: color .15s;
    }
    .nav-links a.active,
    .nav-links a:hover { color: white; text-decoration: none; }

    .has-dropdown { position: relative; }
    .caret { font-size: .7rem; opacity: .85; }
    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: .5rem;
      min-width: 230px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: 0 12px 32px rgba(0,0,0,.2);
      padding: .4rem;
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-6px);
      transition: opacity .15s, transform .15s, visibility .15s;
      z-index: 200;
    }
    .has-dropdown:hover .dropdown,
    .has-dropdown:focus-within .dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .dropdown a {
      color: var(--color-text);
      font-size: .95rem;
      font-weight: 500;
      padding: .5rem .7rem;
      border-radius: 4px;
      white-space: nowrap;
    }
    .dropdown a:hover { background: var(--color-bg-alt); color: var(--color-primary); text-decoration: none; }
    .dropdown a.active { color: var(--color-primary); }

    .btn-logout {
      background: none;
      border: 1px solid rgba(255,255,255,.45);
      color: rgba(255,255,255,.8);
      cursor: pointer;
      padding: .2rem .7rem;
      border-radius: 4px;
      font-size: .85rem;
      &:hover { border-color: white; color: white; }
    }
  `],
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private pagineService = inject(PagineService);
  private gruppiService = inject(GruppiService);

  private readonly pagine = toSignal(this.pagineService.getAll(), { initialValue: [] });
  private readonly gruppi = toSignal(this.gruppiService.getAll(), { initialValue: [] });

  // Sottomenu "La Parrocchia": elenco delle sole sezioni che hanno pagine.
  // Cliccando una sezione si apre la vista a card (/parrocchia/:sezione).
  readonly menuParrocchia = computed(() => {
    const order: SezionePagina[] = [
      'parrocchia', 'parroco', 'diacono', 'caritas',
      'consultorio', 'organismi', 'sacramenti', 'altro',
    ];
    const presenti = new Set(this.pagine().map(p => p.sezione));
    return order
      .filter(sezione => presenti.has(sezione))
      .map(sezione => ({
        sezione,
        link: sezione === 'parrocchia' ? ['/parrocchia'] : ['/parrocchia', sezione],
      }));
  });

  // Sottomenu "Gruppi": elenco delle sole aree che hanno gruppi.
  // Cliccando un'area si apre la vista a card (/gruppi/:area).
  readonly menuGruppi = computed(() => {
    const order: AreaGruppo[] = ['liturgia', 'catechesi', 'carita'];
    const presenti = new Set(this.gruppi().map(g => g.area));
    return order
      .filter(area => presenti.has(area))
      .map(area => ({ area }));
  });

  label(sezione: SezionePagina): string {
    return SEZIONE_LABELS[sezione];
  }

  labelArea(area: AreaGruppo): string {
    return AREA_LABELS[area];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
