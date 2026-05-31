import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  IntenzionePreghiera,
  NuovaIntenzionePreghiera,
} from '../models/intenzione-preghiera.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class IntenzioniPreghieraService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/intenzioni-preghiera`;

  // Pubblico
  create(data: NuovaIntenzionePreghiera) {
    return this.http.post<IntenzionePreghiera>(this.base, data);
  }

  // Riservato (JWT)
  getAll() {
    return this.http.get<IntenzionePreghiera[]>(this.base);
  }

  markLetta(id: string, letta: boolean) {
    return this.http.patch<IntenzionePreghiera>(`${this.base}/${id}`, { letta });
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
