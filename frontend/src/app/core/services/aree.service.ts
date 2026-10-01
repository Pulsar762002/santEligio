import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AreaMia, ContenutoArea, Esito, Proposta, StatoProposta } from '../models/area.model';
import { AreaPortale } from '../models/utente.model';
import { Evento } from '../models/evento.model';

/** Contenuti per area (Responsabili e Contributor) e approvazioni. */
@Injectable({ providedIn: 'root' })
export class AreeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/aree`;

  mie() {
    return this.http.get<AreaMia[]>(this.url);
  }

  contenuto(area: string) {
    return this.http.get<ContenutoArea>(`${this.url}/${area}/contenuto`);
  }

  salvaContenuto(area: string, c: ContenutoArea) {
    const { titolo, sottotitolo, contenuto, immagine } = c;
    return this.http.put<Esito<unknown>>(`${this.url}/${area}/contenuto`, { titolo, sottotitolo, contenuto, immagine });
  }

  /** Tutte le aree (nomi), per etichettare gli eventi condivisi. */
  elenco() {
    return this.http.get<AreaPortale[]>(`${this.url}/elenco`);
  }

  // ── Eventi gestibili dall'utente (tutti per l'admin, quelli delle proprie aree per gli altri) ──

  eventi(area?: string) {
    const params = area ? new HttpParams().set('area', area) : undefined;
    return this.http.get<Evento[]>(`${environment.apiUrl}/gestione/eventi`, { params });
  }

  creaEvento(e: Partial<Evento>) {
    return this.http.post<Esito<Evento>>(`${environment.apiUrl}/gestione/eventi`, e);
  }

  modificaEvento(id: string, e: Partial<Evento>) {
    return this.http.patch<Esito<Evento>>(`${environment.apiUrl}/gestione/eventi/${id}`, e);
  }

  eliminaEvento(id: string) {
    return this.http.delete<{ ok: boolean }>(`${environment.apiUrl}/gestione/eventi/${id}`);
  }

  proposte(stato?: StatoProposta) {
    const params = stato ? new HttpParams().set('stato', stato) : undefined;
    return this.http.get<Proposta[]>(`${environment.apiUrl}/proposte`, { params });
  }

  approva(id: string) {
    return this.http.post<Proposta>(`${environment.apiUrl}/proposte/${id}/approva`, {});
  }

  rifiuta(id: string, nota: string) {
    return this.http.post<Proposta>(`${environment.apiUrl}/proposte/${id}/rifiuta`, { nota });
  }
}
