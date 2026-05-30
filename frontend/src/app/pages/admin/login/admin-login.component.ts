import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="login-box">
        <h1>Accesso Admin</h1>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="login()" #f="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              autocomplete="email"
            />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="loading() || !f.valid">
            {{ loading() ? 'Accesso in corso...' : 'Accedi' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
      padding: 2rem;
    }
    .login-box {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: 2.5rem;
      width: 100%;
      max-width: 420px;
      h1 { margin-bottom: 1.5rem; font-size: 1.5rem; }
    }
    .btn { width: 100%; justify-content: center; padding: .7rem; font-size: 1rem; }
    button:disabled { opacity: .6; cursor: not-allowed; }
  `],
})
export class AdminLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  login(): void {
    this.loading.set(true);
    this.error.set('');
    this.authService.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.error.set('Credenziali non valide.');
        this.loading.set(false);
      },
    });
  }
}
