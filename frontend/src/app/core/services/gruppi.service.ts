import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Gruppo, AreaGruppo } from '../models/gruppo.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GruppiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/gruppi`;

  getAll(area?: AreaGruppo) {
    const params: Record<string, string> = {};
    if (area) params['area'] = area;
    return this.http.get<Gruppo[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<Gruppo>(`${this.base}/${id}`);
  }

  create(data: Partial<Gruppo>) {
    return this.http.post<Gruppo>(this.base, data);
  }

  update(id: string, data: Partial<Gruppo>) {
    return this.http.patch<Gruppo>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
