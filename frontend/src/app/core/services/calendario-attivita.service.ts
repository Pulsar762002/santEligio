import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CalendarioAttivita } from '../models/calendario-attivita.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CalendarioAttivitaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/calendario-attivita`;

  getAll(anno: number, mese: number, tutti = false) {
    const params: Record<string, string> = { anno: String(anno), mese: String(mese) };
    if (tutti) params['tutti'] = 'true';
    return this.http.get<CalendarioAttivita[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<CalendarioAttivita>(`${this.base}/${id}`);
  }

  create(data: Partial<CalendarioAttivita>) {
    return this.http.post<CalendarioAttivita>(this.base, data);
  }

  update(id: string, data: Partial<CalendarioAttivita>) {
    return this.http.patch<CalendarioAttivita>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  genera(anno: number, mese: number) {
    const params = { anno: String(anno), mese: String(mese) };
    return this.http.post<CalendarioAttivita[]>(`${this.base}/genera`, {}, { params });
  }
}
