import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Ruolo, UtenteCorrente } from '../models/utente.model';

const TOKEN_KEY = 'access_token';

interface JwtPayload {
  sub: string;
  email: string;
  ruolo: Ruolo;
  exp?: number;
}

function decodeToken(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const p = JSON.parse(json) as JwtPayload;
    return p.exp && p.exp * 1000 < Date.now() ? null : p;
  } catch {
    return null;
  }
}

const STAFF: Ruolo[] = ['admin', 'responsabile', 'contributor'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  /** Profilo letto dal server (ruolo e aree aggiornati); null finché non caricato. */
  private readonly _me = signal<UtenteCorrente | null>(null);

  readonly token = this._token.asReadonly();
  readonly me = this._me.asReadonly();
  private readonly payload = computed(() => decodeToken(this._token()));

  readonly isLoggedIn = computed(() => !!this.payload());
  /** Ruolo dal profilo se caricato, altrimenti (provvisorio) dal token. */
  readonly ruolo = computed<Ruolo | null>(() =>
    this.isLoggedIn() ? this._me()?.ruolo ?? this.payload()?.ruolo ?? null : null);
  readonly isAdmin = computed(() => this.ruolo() === 'admin');
  /** Può entrare nel pannello: admin, responsabili e contributor. */
  readonly isStaff = computed(() => STAFF.includes(this.ruolo() as Ruolo));
  readonly aree = computed(() => this._me()?.aree ?? []);
  readonly puoGestireGrest = computed(() =>
    this.isAdmin() || (this.ruolo() === 'responsabile' && this.aree().includes('grest')));
  readonly puoApprovare = computed(() => this.isAdmin() || this.ruolo() === 'responsabile');

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ access_token }) => {
          localStorage.setItem(TOKEN_KEY, access_token);
          this._token.set(access_token);
          this._me.set(null);
        }),
        switchMap(() => this.caricaMe()),
      );
  }

  private inCorso: Observable<UtenteCorrente | null> | null = null;

  /**
   * Ricarica il profilo. Solo un 401 (token non più valido, utente disattivato) fa
   * logout; un errore temporaneo (rete, limite di richieste) lascia la sessione intatta.
   * Le chiamate contemporanee (avvio app + guard) condividono la stessa richiesta.
   */
  caricaMe(): Observable<UtenteCorrente | null> {
    if (!this.isLoggedIn()) return of(null);
    if (!this.inCorso) {
      this.inCorso = this.http.get<UtenteCorrente>(`${environment.apiUrl}/auth/me`).pipe(
        tap((me) => this._me.set(me)),
        catchError((err) => {
          if (err?.status === 401) this.logout();
          return of(this._me());
        }),
        finalize(() => (this.inCorso = null)),
        shareReplay(1),
      );
    }
    return this.inCorso;
  }

  /** Profilo già caricato oppure lo carica (per i guard). */
  assicuraMe(): Observable<UtenteCorrente | null> {
    return this._me() ? of(this._me()) : this.caricaMe();
  }

  cambiaPassword(attuale: string, nuova: string) {
    return this.http.put<{ ok: boolean }>(`${environment.apiUrl}/auth/password`, { attuale, nuova });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this._me.set(null);
  }
}

