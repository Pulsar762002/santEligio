// Conversione dei dati del vecchio portale Grest (SQLite: tabelle users,
// autorizzazioneUtente, delegaUtente) nei documenti della collection grest_iscritti.
// Usata da seed-grest.ts; funzioni pure così da poterle testare e verificare.

import { GrestAutorizzazione, GrestDelega, GrestIscritto } from './schemas/grest-iscritto.schema';

export type RigaSql = Record<string, string | number | null>;

export interface ExportLegacy {
  users: RigaSql[];
  autorizzazioni: RigaSql[];
  deleghe: RigaSql[];
}

/** Iscritto pronto per Mongo, con la password ancora in chiaro (la cifra lo script). */
export type IscrittoLegacy = Omit<GrestIscritto, 'password'> & { passwordInChiaro: string };

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const bool = (v: unknown) => v === 1 || v === '1' || v === true;

export function mappaAutorizzazione(r: RigaSql): GrestAutorizzazione {
  return {
    dichiarazione1: bool(r.dihiarazione1),
    dichiarazione2: bool(r.dihiarazione2),
    dichiarazione3: bool(r.dihiarazione3),
    dichiarazione4: bool(r.dihiarazione4),
    dichiarazione5: bool(r.dihiarazione5),
    dichiarazione6: bool(r.dihiarazione6),
    dichiarazione7: bool(r.dihiarazione7),
    dichiarazione8: bool(r.dihiarazione8),
    allergie: str(r.allergie),
    intolleranze: str(r.intolleranze),
    autorizzazione1: bool(r.autorizzazione1),
    autorizzazione2: bool(r.autorizzazione2),
    autorizzazione3: bool(r.autorizzazione3),
    autorizzazione4: bool(r.autorizzazione4),
    autorizzazione5: bool(r.autorizzazione5),
    consenso: bool(r.consenso),
  };
}

export function mappaDelega(r: RigaSql): GrestDelega {
  const delegati = [1, 2, 3, 4]
    .map((n) => ({
      nome: str(r[`nomeDelegato${n}`]).trim(),
      cognome: str(r[`cognomeDelegato${n}`]).trim(),
      tipoDocumento: str(r[`documentoDelegato${n}`]).trim(),
      numeroDocumento: str(r[`numeroDocumentoDelegato${n}`]).trim(),
    }))
    .filter((d) => d.nome || d.cognome || d.tipoDocumento || d.numeroDocumento);
  return { delegati, consenso: bool(r.consenso) };
}

export function mappaIscritto(
  u: RigaSql,
  aut: RigaSql | undefined,
  del: RigaSql | undefined,
): IscrittoLegacy {
  const attivo = bool(u.isActive);
  const username = str(u.username);
  return {
    legacyId: Number(u.id),
    username,
    usernameLower: username.toLowerCase(),
    passwordInChiaro: str(u.password),
    attivo,
    abilitato: false,
    // Il token serve solo a chi deve ancora attivare l'account: per gli account
    // già attivi un vecchio link non deve poter reimpostare la password.
    activationToken: attivo ? undefined : str(u.activationToken) || undefined,
    nomePadre: str(u.nomePadre),
    cognomePadre: str(u.cognomePadre),
    emailPadre: str(u.emailPadre),
    mobilePhonePadre: str(u.mobilePhonePadre),
    nomeMadre: str(u.nomeMadre),
    cognomeMadre: str(u.cognomeMadre),
    emailMadre: str(u.emailMadre),
    mobilePhoneMadre: str(u.mobilePhoneMadre),
    nomeFiglio: str(u.nomeFiglio),
    cognomeFiglio: str(u.cognomeFiglio),
    natoA: str(u.natoA),
    natoIl: str(u.natoIl),
    residenteA: str(u.residenteA),
    via: str(u.via),
    annoCatechismo: str(u.annoCatechismo),
    annoElementari: str(u.annoElementari),
    taglia: str(u.taglia),
    altroContatto: str(u.altroContatto),
    mobilePhoneAltro: str(u.mobilePhoneAltro),
    altroDaSegnalare: str(u.altroDaSegnalare),
    // '' nel vecchio DB = modulo d'iscrizione mai salvato
    uscita1: u.uscita1 === '' || u.uscita1 === null || u.uscita1 === undefined ? null : bool(u.uscita1),
    uscita2: bool(u.uscita2),
    consenso: bool(u.consenso),
    autorizzazione: aut ? mappaAutorizzazione(aut) : null,
    delega: del ? mappaDelega(del) : null,
    cancellazioneRichiesta: null,
    cancellazioneMotivo: '',
  };
}

/** Converte l'intero export. Fallisce se ci sono moduli senza un utente corrispondente. */
export function mappaExport(e: ExportLegacy): IscrittoLegacy[] {
  const perUtente = (righe: RigaSql[]) => {
    const m = new Map<number, RigaSql>();
    for (const r of righe) {
      const id = Number(r.userId);
      if (m.has(id)) throw new Error(`userId ${id} duplicato nei moduli`);
      m.set(id, r);
    }
    return m;
  };
  const aut = perUtente(e.autorizzazioni);
  const del = perUtente(e.deleghe);
  const ids = new Set(e.users.map((u) => Number(u.id)));
  for (const id of [...aut.keys(), ...del.keys()]) {
    if (!ids.has(id)) throw new Error(`Modulo con userId ${id} senza utente corrispondente`);
  }
  return e.users.map((u) => mappaIscritto(u, aut.get(Number(u.id)), del.get(Number(u.id))));
}
