import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GrestService } from '../services/grest.service';

/** Area famiglie del Grest: senza login valido si torna alla pagina di accesso. */
export const grestGuard: CanActivateFn = () => {
  const grest = inject(GrestService);
  if (grest.isLoggedIn()) return true;
  grest.logout();
  return inject(Router).parseUrl('/grest/accedi');
};
