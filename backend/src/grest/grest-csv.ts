import { GrestIscritto } from './schemas/grest-iscritto.schema';

type Riga = GrestIscritto & { _id?: unknown; createdAt?: Date };

const siNo = (v: boolean | null | undefined) => (v == null ? '' : v ? 'Sì' : 'No');

// Colonne dell'export iscritti (stesso contenuto del vecchio "get_all", senza password/token).
const COLONNE: [string, (r: Riga) => unknown][] = [
  ['Id', (r) => r.legacyId ?? String(r._id)],
  ['Username', (r) => r.username],
  ['Attivo', (r) => siNo(r.attivo)],
  ['Nome figlio', (r) => r.nomeFiglio],
  ['Cognome figlio', (r) => r.cognomeFiglio],
  ['Nato a', (r) => r.natoA],
  ['Nato il', (r) => r.natoIl],
  ['Residenza', (r) => r.residenteA],
  ['Via', (r) => r.via],
  ['Catechismo', (r) => r.annoCatechismo],
  ['Classe', (r) => r.annoElementari],
  ['Taglia', (r) => r.taglia],
  ['Nome padre', (r) => r.nomePadre],
  ['Cognome padre', (r) => r.cognomePadre],
  ['Email padre', (r) => r.emailPadre],
  ['Cellulare padre', (r) => r.mobilePhonePadre],
  ['Nome madre', (r) => r.nomeMadre],
  ['Cognome madre', (r) => r.cognomeMadre],
  ['Email madre', (r) => r.emailMadre],
  ['Cellulare madre', (r) => r.mobilePhoneMadre],
  ['Altro contatto', (r) => r.altroContatto],
  ['Cellulare altro contatto', (r) => r.mobilePhoneAltro],
  ['Note', (r) => r.altroDaSegnalare],
  ['Uscita (Mieleria)', (r) => siNo(r.uscita1)],
  ['Consenso iscrizione', (r) => siNo(r.consenso)],
  ['Autorizzazione compilata', (r) => siNo(!!r.autorizzazione)],
  ['Problemi di salute', (r) => siNo(r.autorizzazione?.dichiarazione1)],
  ['Allergie', (r) => siNo(r.autorizzazione?.dichiarazione2)],
  ['Allergie dettaglio', (r) => r.autorizzazione?.allergie],
  ['Intolleranze', (r) => siNo(r.autorizzazione?.dichiarazione3)],
  ['Intolleranze dettaglio', (r) => r.autorizzazione?.intolleranze],
  ['L. 104/92', (r) => siNo(r.autorizzazione?.dichiarazione4)],
  ['Assistenza individuale', (r) => siNo(r.autorizzazione?.dichiarazione5)],
  ['Presa visione no medicinali', (r) => siNo(r.autorizzazione?.dichiarazione6)],
  ['Dichiarazione artt. 75-76', (r) => siNo(r.autorizzazione?.dichiarazione7)],
  ['Uscita con tutore/delegato', (r) => siNo(r.autorizzazione?.autorizzazione1)],
  ['Foto e pubblicazione', (r) => siNo(r.autorizzazione?.autorizzazione2)],
  ['Attività esterne', (r) => siNo(r.autorizzazione?.autorizzazione3)],
  ['Emergenza sanitaria', (r) => siNo(r.autorizzazione?.autorizzazione4)],
  ['Consenso autorizzazioni', (r) => siNo(r.autorizzazione?.consenso)],
  ...[0, 1, 2, 3].flatMap((n): [string, (r: Riga) => unknown][] => [
    [`Delegato ${n + 1}`, (r) => {
      const d = r.delega?.delegati?.[n];
      return d ? `${d.nome} ${d.cognome}` : '';
    }],
    [`Documento delegato ${n + 1}`, (r) => {
      const d = r.delega?.delegati?.[n];
      return d ? `${d.tipoDocumento} ${d.numeroDocumento}` : '';
    }],
  ]),
  ['Consenso deleghe', (r) => (r.delega ? siNo(r.delega.consenso) : '')],
];

function cella(v: unknown): string {
  // I testi liberi arrivano dalle famiglie: niente formule eseguite da Excel.
  const s = String(v ?? '').replace(/^[=+\-@\t]/, "'$&");
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con separatore ";" e BOM UTF-8, così Excel in italiano lo apre correttamente. */
export function iscrittiCsv(righe: Riga[]): string {
  const linee = [COLONNE.map(([t]) => t), ...righe.map((r) => COLONNE.map(([, f]) => f(r)))];
  return '﻿' + linee.map((l) => l.map(cella).join(';')).join('\r\n') + '\r\n';
}
