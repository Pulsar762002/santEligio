import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { News, CategoriaNews } from '../models/news.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/news`;

  getAll(categoria?: CategoriaNews) {
    const params: Record<string, string> = {};
    if (categoria) params['categoria'] = categoria;
    return this.http.get<News[]>(this.base, { params });
  }

  getOne(id: string) {
    return this.http.get<News>(`${this.base}/${id}`);
  }

  create(data: Partial<News>) {
    return this.http.post<News>(this.base, data);
  }

  update(id: string, data: Partial<News>) {
    return this.http.patch<News>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
