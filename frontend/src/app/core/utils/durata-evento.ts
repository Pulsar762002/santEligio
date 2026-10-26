import { Evento } from '../models/evento.model';

type DateEvento = Pick<Evento, 'dataInizio' | 'dataFine'>;

export type StatoEvento = 'futuro' | 'in-corso' | 'passato';

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

const inizioGiorno = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Giorni di calendario coperti dall'evento (1 = si svolge in un solo giorno). */
export function giorniEvento(e: DateEvento): number {
  if (!e.dataFine) return 1;
  const diff = inizioGiorno(new Date(e.dataFine)) - inizioGiorno(new Date(e.dataInizio));
  return Math.max(1, Math.round(diff / 86_400_000) + 1);
}

/** Stessa regola della pagina /eventi: finito dopo la data di fine (o l'inizio, se manca). */
export function statoEvento(e: DateEvento, now = new Date()): StatoEvento {
  const inizio = new Date(e.dataInizio);
  const fine = e.dataFine ? new Date(e.dataFine) : inizio;
  if (fine < now) return 'passato';
  return inizio <= now ? 'in-corso' : 'futuro';
}

/** "all'8 dicembre", "al 1° marzo", "al 15 giugno" (anno solo se diverso da quello corrente). */
export function alGiorno(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const g = d.getDate();
  const anno = d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : '';
  const art = g === 8 || g === 11 ? "all'" : 'al ';
  return `${art}${g === 1 ? '1°' : g} ${MESI[d.getMonth()]}${anno}`;
}

/**
 * Etichetta breve sullo stato di un evento non ancora finito:
 * "In corso · fino all'8 dicembre", "Ultimo giorno", "Oggi", "Domani", "Tra 3 giorni".
 */
export function etichettaStato(e: DateEvento, now = new Date()): string | null {
  const stato = statoEvento(e, now);
  if (stato === 'passato') return null;
  const oggi = inizioGiorno(now);
  if (stato === 'in-corso') {
    if (giorniEvento(e) === 1 || !e.dataFine) return 'In corso';
    return inizioGiorno(new Date(e.dataFine)) === oggi ? 'Ultimo giorno' : `In corso · fino ${alGiorno(e.dataFine, now)}`;
  }
  const tra = Math.round((inizioGiorno(new Date(e.dataInizio)) - oggi) / 86_400_000);
  if (tra === 0) return 'Oggi';
  if (tra === 1) return 'Domani';
  return tra <= 7 ? `Tra ${tra} giorni` : null;
}
