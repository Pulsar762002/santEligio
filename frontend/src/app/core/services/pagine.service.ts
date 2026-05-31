import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pagina, SezionePagina } from '../models/pagina.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PagineService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/pagine`;

  getAll(sezione?: SezionePagina, tutte = false) {
    const params: Record<string, string> = {};
    if (sezione) params['sezione'] = sezione;
    if (tutte) params['tutte'] = 'true';
    return this.http.get<Pagina[]>(this.base, { params });
  }

  getBySlug(slug: string) {
    return this.http.get<Pagina>(`${this.base}/${slug}`);
  }

  create(data: Partial<Pagina>) {
    return this.http.post<Pagina>(this.base, data);
  }

  update(id: string, data: Partial<Pagina>) {
    return this.http.patch<Pagina>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
