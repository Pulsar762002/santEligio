import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { GrestService } from '../services/grest.service';

// Le chiamate all'area famiglie del Grest (/api/grest/..., escluso /api/grest/admin/...)
// usano il token Grest; tutto il resto il token admin del portale.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const grest = /\/grest\//.test(req.url) && !/\/grest\/admin\//.test(req.url);
  const token = grest ? inject(GrestService).token() : inject(AuthService).token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
