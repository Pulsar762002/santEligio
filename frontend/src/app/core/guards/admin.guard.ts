import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) return true;

  // Loggato ma senza ruolo admin → home; non loggato → login.
  router.navigate([auth.isLoggedIn() ? '/' : '/admin/login']);
  return false;
};
