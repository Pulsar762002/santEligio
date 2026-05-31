import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadsService {
  private readonly http = inject(HttpClient);

  // POST multipart al backend; il token viene aggiunto dall'authInterceptor.
  upload(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/uploads`, data);
  }
}
