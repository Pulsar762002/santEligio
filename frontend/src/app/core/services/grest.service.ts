import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  GrestAutorizzazione, GrestDatiFamiglia, GrestDelega, GrestIscritto, GrestIscrizione,
  GrestImpostazioni, GrestStato, ModuloGrest,
} from '../models/grest.model';

const TOKEN_KEY = 'grest_token';

function scaduto(token: string | null): boolean {
  if (!token) return true;
  try {
    const p = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof p.exp === 'number' && p.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Area famiglie del Grest. Token separato da quello admin (vedi authInterceptor). */
@Injectable({ providedIn: 'root' })
export class GrestService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/grest`;
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !scaduto(this._token()));

  stato() {
    return this.http.get<GrestStato>(`${this.url}/stato`);
  }

  registra(dati: GrestDatiFamiglia) {
    return this.http.post<{ username: string; emailInviata: boolean }>(`${this.url}/registrazione`, dati);
  }

  infoAttivazione(token: string) {
    return this.http.get<{ username: string; nomeFiglio: string; attivo: boolean }>(
      `${this.url}/attivazione`, { params: { token } },
    );
  }

  attiva(token: string, password: string) {
    return this.http.post<{ username: string }>(`${this.url}/attivazione`, { token, password });
  }

  login(username: string, password: string) {
    return this.http
      .post<{ access_token: string; username: string }>(`${this.url}/login`, { username, password })
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

  me() {
    return this.http.get<GrestIscritto>(`${this.url}/me`);
  }

  salvaIscrizione(dati: GrestIscrizione) {
    return this.http.put<GrestIscritto>(`${this.url}/me/iscrizione`, dati);
  }

  salvaAutorizzazione(dati: GrestAutorizzazione) {
    return this.http.put<GrestIscritto>(`${this.url}/me/autorizzazione`, dati);
  }

  salvaDelega(dati: GrestDelega) {
    return this.http.put<GrestIscritto>(`${this.url}/me/delega`, dati);
  }

  cambiaPassword(attuale: string, nuova: string) {
    return this.http.put<{ ok: boolean }>(`${this.url}/me/password`, { attuale, nuova });
  }

  scaricaModulo(modulo: ModuloGrest) {
    return this.http.get(`${this.url}/me/moduli/${modulo}`, { responseType: 'blob' });
  }

  // ── Amministrazione (token admin del portale) ──

  impostazioni() {
    return this.http.get<GrestImpostazioni>(`${this.url}/admin/impostazioni`);
  }

  salvaImpostazioni(iscrizioniAperte: boolean) {
    return this.http.put<GrestImpostazioni>(`${this.url}/admin/impostazioni`, { iscrizioniAperte });
  }

  elenco() {
    return this.http.get<GrestIscritto[]>(`${this.url}/admin/iscritti`);
  }

  esportaCsv() {
    return this.http.get(`${this.url}/admin/iscritti.csv`, { responseType: 'blob' });
  }

  scaricaModuloAdmin(id: string, modulo: ModuloGrest) {
    return this.http.get(`${this.url}/admin/iscritti/${id}/moduli/${modulo}`, { responseType: 'blob' });
  }

  linkPassword(id: string) {
    return this.http.post<{ inviata: boolean; destinatari: string[]; link: string }>(
      `${this.url}/admin/iscritti/${id}/link-password`, {},
    );
  }

  elimina(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.url}/admin/iscritti/${id}`);
  }
}

/** Avvia il download di un Blob nel browser. */
export function salvaFile(blob: Blob, nome: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
