import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GalleriaCategoria, GalleriaItem } from '../models/galleria.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GalleriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/galleria`;

  // categorie
  getCategorie() {
    return this.http.get<GalleriaCategoria[]>(`${this.base}/categorie`);
  }
  createCategoria(data: Partial<GalleriaCategoria>) {
    return this.http.post<GalleriaCategoria>(`${this.base}/categorie`, data);
  }
  updateCategoria(id: string, data: Partial<GalleriaCategoria>) {
    return this.http.patch<GalleriaCategoria>(`${this.base}/categorie/${id}`, data);
  }
  removeCategoria(id: string) {
    return this.http.delete(`${this.base}/categorie/${id}`);
  }

  // item
  getItems(categoria?: string) {
    const params = categoria ? { params: { categoria } } : {};
    return this.http.get<GalleriaItem[]>(this.base, params);
  }
  createItem(data: Partial<GalleriaItem>) {
    return this.http.post<GalleriaItem>(this.base, data);
  }
  updateItem(id: string, data: Partial<GalleriaItem>) {
    return this.http.patch<GalleriaItem>(`${this.base}/${id}`, data);
  }
  removeItem(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
