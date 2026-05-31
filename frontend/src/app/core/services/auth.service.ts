import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'access_token';

interface JwtPayload {
  sub: string;
  email: string;
  ruolo: string;
  exp?: number;
}

function decodeToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly token = this._token.asReadonly();
  private readonly payload = computed(() => decodeToken(this._token()));

  readonly isLoggedIn = computed(() => !!this.payload());
  readonly ruolo = computed(() => this.payload()?.ruolo ?? null);
  readonly isAdmin = computed(() => this.ruolo() === 'admin');

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ access_token }) => {
          localStorage.setItem(TOKEN_KEY, access_token);
          this._token.set(access_token);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
  }
}
