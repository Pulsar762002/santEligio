import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AreaPortale, Ruolo, Utente } from '../models/utente.model';

export interface NuovoUtente {
  email: string;
  nome: string;
  ruolo: Ruolo;
  aree: string[];
  password: string;
}

/** Gestione utenti del portale (solo admin). */
@Injectable({ providedIn: 'root' })
export class UtentiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/utenti`;

  elenco() {
    return this.http.get<Utente[]>(this.url);
  }

  aree() {
    return this.http.get<AreaPortale[]>(`${this.url}/aree`);
  }

  crea(u: NuovoUtente) {
    return this.http.post<Utente>(this.url, u);
  }

  modifica(id: string, u: Partial<Pick<Utente, 'nome' | 'ruolo' | 'aree' | 'attivo'>>) {
    return this.http.patch<Utente>(`${this.url}/${id}`, u);
  }

  impostaPassword(id: string, password: string) {
    return this.http.put<{ ok: boolean }>(`${this.url}/${id}/password`, { password });
  }

  elimina(id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.url}/${id}`);
  }
}
