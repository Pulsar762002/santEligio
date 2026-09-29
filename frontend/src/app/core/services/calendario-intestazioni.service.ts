import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarioIntestazione } from '../models/calendario-intestazione.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CalendarioIntestazioniService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/calendario-intestazioni`;

  /** L'intestazione del mese, o null se non impostata. */
  get(anno: number, mese: number) {
    const params = { anno: String(anno), mese: String(mese) };
    return this.http.get<CalendarioIntestazione | null>(this.base, { params });
  }

  /** Salva (upsert) l'intestazione; titolo e descrizione vuoti la rimuovono (risposta null). */
  salva(anno: number, mese: number, data: { titolo: string; descrizione: string }) {
    const params = { anno: String(anno), mese: String(mese) };
    return this.http.put<CalendarioIntestazione | null>(this.base, data, { params });
  }
}
