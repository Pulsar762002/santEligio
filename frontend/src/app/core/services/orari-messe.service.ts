import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OrarioMessa, TipoMessa } from '../models/orario-messa.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrariMesseService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/orari-messe`;

  getAll(tipo?: TipoMessa) {
    const params: Record<string, string> = {};
    if (tipo) params['tipo'] = tipo;
    return this.http.get<OrarioMessa[]>(this.base, { params });
  }

  create(data: Partial<OrarioMessa>) {
    return this.http.post<OrarioMessa>(this.base, data);
  }

  update(id: string, data: Partial<OrarioMessa>) {
    return this.http.patch<OrarioMessa>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
