import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Media } from '../models/media.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/media`;

  getAll() {
    return this.http.get<Media[]>(this.base);
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
