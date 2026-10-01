import { SetMetadata } from '@nestjs/common';

export const RUOLI = ['admin', 'responsabile', 'contributor', 'utente'] as const;
export type Ruolo = (typeof RUOLI)[number];

/** Ruoli che possono gestire contenuti dal pannello (gli "utenti" no). */
export const RUOLI_STAFF: Ruolo[] = ['admin', 'responsabile', 'contributor'];

/** Utente autenticato (req.user), ricaricato dal DB a ogni richiesta. */
export interface UtenteAutenticato {
  userId: string;
  email: string;
  nome: string;
  ruolo: Ruolo;
  aree: string[];
}

export const RUOLI_KEY = 'ruoli';
export const AREA_KEY = 'area';

/**
 * Ruoli ammessi su una rotta protetta da JwtAuthGuard.
 * Senza questo decoratore la rotta è riservata all'admin.
 */
export const Ruoli = (...ruoli: Ruolo[]) => SetMetadata(RUOLI_KEY, ruoli);

/** I non-admin devono avere quest'area assegnata (es. 'grest'). */
export const PerArea = (area: string) => SetMetadata(AREA_KEY, area);

export function haArea(u: UtenteAutenticato, area: string): boolean {
  return u.ruolo === 'admin' || u.aree.includes(area);
}
