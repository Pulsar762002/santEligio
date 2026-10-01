import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AreaMia, ContenutoArea, Esito, EventoArea, Proposta, StatoProposta } from '../models/area.model';

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

  eventi(area: string) {
    return this.http.get<EventoArea[]>(`${this.url}/${area}/eventi`);
  }

  creaEvento(area: string, e: Partial<EventoArea>) {
    return this.http.post<Esito<EventoArea>>(`${this.url}/${area}/eventi`, e);
  }

  modificaEvento(area: string, id: string, e: Partial<EventoArea>) {
    return this.http.patch<Esito<EventoArea>>(`${this.url}/${area}/eventi/${id}`, e);
  }

  eliminaEvento(area: string, id: string) {
    return this.http.delete<{ ok: boolean }>(`${this.url}/${area}/eventi/${id}`);
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
