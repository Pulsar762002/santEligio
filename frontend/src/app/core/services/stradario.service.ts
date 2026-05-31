import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Strada } from '../models/strada.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StradarioService {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<Strada[]>(`${environment.apiUrl}/stradario`);
  }
}
