import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MENU } from './navbar.menu';

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
          @for (entry of menu; track entry.label) {
            @if (entry.children) {
              <li class="has-dropdown">
                <a [routerLink]="entry.link ?? null" routerLinkActive="active">{{ entry.label }} <span class="caret" aria-hidden="true">▾</span></a>
                <div class="dropdown">
                  @for (group of entry.children; track group.label) {
                    @if (group.children) {
                      <div class="dropdown-sub">
                        <span class="sub-trigger">{{ group.label }} <span class="caret-r" aria-hidden="true">›</span></span>
                        <div class="flyout">
                          @for (leaf of group.children; track leaf.label) {
                            <a [routerLink]="leaf.link" routerLinkActive="active"
                               [routerLinkActiveOptions]="{ exact: true }">{{ leaf.label }}</a>
                          }
                        </div>
                      </div>
                    } @else {
                      <a [routerLink]="group.link" routerLinkActive="active"
                         [routerLinkActiveOptions]="{ exact: true }">{{ group.label }}</a>
                    }
                  }
                </div>
              </li>
            } @else {
              <li>
                <a [routerLink]="entry.link" routerLinkActive="active"
                   [routerLinkActiveOptions]="{ exact: !!entry.exact }">{{ entry.label }}</a>
              </li>
            }
          }
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
    .nav-links > li > a {
      color: rgba(255,255,255,.8);
      font-size: 1.05rem;
      font-weight: 500;
      transition: color .15s;
      cursor: pointer;
    }
    .nav-links > li > a.active,
    .nav-links > li > a:hover { color: white; text-decoration: none; }

    .has-dropdown { position: relative; }
    .caret { font-size: .7rem; opacity: .85; }
    .caret-r { font-size: .9rem; opacity: .6; margin-left: auto; padding-left: .75rem; }

    .dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: .5rem;
      min-width: 240px;
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
    .has-dropdown:hover > .dropdown,
    .has-dropdown:focus-within > .dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .dropdown a,
    .dropdown .sub-trigger {
      display: flex;
      align-items: center;
      color: var(--color-text);
      font-size: .95rem;
      font-weight: 500;
      padding: .5rem .7rem;
      border-radius: 4px;
      white-space: nowrap;
      cursor: pointer;
    }
    .dropdown a:hover,
    .dropdown .sub-trigger:hover {
      background: var(--color-bg-alt);
      color: var(--color-primary);
      text-decoration: none;
    }
    .dropdown a.active { color: var(--color-primary); }

    /* Terzo livello: flyout laterale */
    .dropdown-sub { position: relative; }
    .flyout {
      position: absolute;
      top: -.4rem;
      left: 100%;
      margin-left: .3rem;
      min-width: 240px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      box-shadow: 0 12px 32px rgba(0,0,0,.2);
      padding: .4rem;
      display: flex;
      flex-direction: column;
      opacity: 0;
      visibility: hidden;
      transform: translateX(-6px);
      transition: opacity .15s, transform .15s, visibility .15s;
      z-index: 210;
    }
    .dropdown-sub:hover > .flyout,
    .dropdown-sub:focus-within > .flyout {
      opacity: 1;
      visibility: visible;
      transform: translateX(0);
    }

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

  protected readonly menu = MENU;

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
