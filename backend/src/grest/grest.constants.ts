// Valori ammessi nei moduli Grest (stessi del vecchio portale: i dati esistenti li usano).

/** Iscrizione al catechismo. "Fatellino/Sorellina" è il valore storico salvato nel DB. */
export const ANNI_CATECHISMO = [
  '1° anno comunione',
  '2° anno comunione',
  '1° anno cresima',
  'Fatellino/Sorellina',
  'Esterno',
] as const;

export const TAGLIE = ['6-7', '8-9', '10-11', '12-13', '14-15', 'XS', 'S', 'M'] as const;

export const TIPI_DOCUMENTO = ["Carta d'Identita", 'Passaporto', 'Patente di guida'] as const;

export const MODULI = ['iscrizione', 'autorizzazione', 'delega'] as const;
export type ModuloGrest = (typeof MODULI)[number];

/** gg/mm/aaaa */
export const DATA_NASCITA_RE = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
/** Telefono: solo cifre (vuoto ammesso dove facoltativo). */
export const TELEFONO_RE = /^[0-9]*$/;
/** Email facoltativa: vuota oppure nel formato a@b.c */
export const EMAIL_O_VUOTA_RE = /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/;
