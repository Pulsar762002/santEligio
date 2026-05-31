import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Strada } from '../models/strada.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StradarioService {
  private readonly http = inject(HttpClient);

  private readonly base = `${environment.apiUrl}/stradario`;

  getAll() {
    return this.http.get<Strada[]>(this.base);
  }

  create(data: Partial<Strada>) {
    return this.http.post<Strada>(this.base, data);
  }

  update(id: string, data: Partial<Strada>) {
    return this.http.patch<Strada>(`${this.base}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
