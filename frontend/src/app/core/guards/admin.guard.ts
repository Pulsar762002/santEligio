import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Ruolo } from '../models/utente.model';

type Profilo = { ruolo: Ruolo; aree: string[] };

// I guard caricano il profilo dal server (ruolo e aree aggiornati) prima di decidere.
// Se il server non risponde ma il token è valido, decidono sul ruolo del token
// (senza aree): le API restano comunque protette lato server.
function guardia(ammesso: (me: Profilo) => boolean): CanActivateFn {
  return (): Observable<boolean | UrlTree> => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.assicuraMe().pipe(
      map((caricato) => {
        const ruolo = caricato?.ruolo ?? auth.ruolo();
        if (!ruolo) return router.parseUrl('/admin/login');
        const me: Profilo = { ruolo, aree: caricato?.aree ?? [] };
        if (ammesso(me)) return true;
        // loggato ma senza permessi: staff al proprio pannello, utenti alla home
        return router.parseUrl(['admin', 'responsabile', 'contributor'].includes(me.ruolo) ? '/admin' : '/');
      }),
    );
  };
}

const staff: Ruolo[] = ['admin', 'responsabile', 'contributor'];

/** Solo Admin (gestione completa dei contenuti e degli utenti). */
export const adminGuard = guardia((me) => me.ruolo === 'admin');

/** Pannello: Admin, Responsabili e Contributor (non gli Utenti). */
export const staffGuard = guardia((me) => staff.includes(me.ruolo));

/** Gestione Grest: Admin o Responsabili con l'area Grest. */
export const grestAdminGuard = guardia(
  (me) => me.ruolo === 'admin' || (me.ruolo === 'responsabile' && me.aree.includes('grest')),
);

/** Qualsiasi utente collegato (es. profilo). */
export const loggatoGuard = guardia(() => true);
