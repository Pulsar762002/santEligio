import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Evento } from '../models/evento.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/eventi`;

  getAll(tutti = false) {
    const params = tutti ? { params: { tutti: 'true' } } : {};
    return this.http.get<Evento[]>(this.base, params);
  }

  getProssimi(limit = 3) {
    return this.http.get<Evento[]>(`${this.base}/prossimi`, { params: { limit: String(limit) } });
  }

  getOne(id: string) {
    return this.http.get<Evento>(`${this.base}/${id}`);
  }

  create(data: Partial<Evento>) {
    return this.http.post<Evento>(this.base, data);
  }

  update(id: string, data: Partial<Evento>) {
    return this.http.patch<Evento>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
