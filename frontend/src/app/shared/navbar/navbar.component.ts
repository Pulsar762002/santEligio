import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a routerLink="/" class="brand">Parrocchia Sant'Eligio</a>
        <ul class="nav-links">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
          <li><a routerLink="/parrocchia" routerLinkActive="active">La Parrocchia</a></li>
          <li><a routerLink="/notizie" routerLinkActive="active">Notizie</a></li>
          <li><a routerLink="/eventi" routerLinkActive="active">Eventi</a></li>
          <li><a routerLink="/orari-messe" routerLinkActive="active">Orari Messe</a></li>
          <li><a routerLink="/gruppi" routerLinkActive="active">Gruppi</a></li>
          <li><a routerLink="/intenzioni-preghiera" routerLinkActive="active">Intenzioni</a></li>
          <li><a routerLink="/p/contatti" routerLinkActive="active">Contatti</a></li>
          @if (auth.isLoggedIn()) {
            <li><a routerLink="/admin" routerLinkActive="active">Admin</a></li>
            <li><button class="btn-logout" (click)="logout()">Esci</button></li>
          }
        </ul>
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
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .brand {
      color: white;
      font-family: var(--font-heading);
      font-size: 1.15rem;
      font-weight: bold;
      white-space: nowrap;
    }
    .nav-links {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      margin: 0;
      padding: 0;
    }
    .nav-links a {
      color: rgba(255,255,255,.8);
      font-size: .9rem;
      transition: color .15s;
    }
    .nav-links a.active,
    .nav-links a:hover { color: white; text-decoration: none; }
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
