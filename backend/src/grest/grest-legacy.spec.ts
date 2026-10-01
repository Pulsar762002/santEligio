import { mappaExport, mappaIscritto } from './grest-legacy';

const user = {
  id: 7, username: 'LucaRossi', password: 'segreta', nomePadre: 'Mario', cognomePadre: 'Rossi',
  emailPadre: 'm@r.it', mobilePhonePadre: '333', nomeMadre: null, cognomeMadre: null,
  emailMadre: null, mobilePhoneMadre: null, nomeFiglio: 'Luca', cognomeFiglio: 'Rossi',
  natoA: 'Roma', natoIl: '01/02/2016', residenteA: 'Roma', via: 'Via Roma 1',
  annoCatechismo: 'Esterno', annoElementari: '4', altroContatto: '', mobilePhoneAltro: '',
  altroDaSegnalare: '', activationToken: 'tok', isActive: 1, taglia: '8-9', uscita1: 1,
  uscita2: 0, consenso: 1,
};

const aut = {
  id: 1, userId: '7', dihiarazione1: 0, dihiarazione2: 1, dihiarazione3: 0, dihiarazione4: 0,
  dihiarazione5: 0, dihiarazione6: 1, dihiarazione7: 1, dihiarazione8: 0, allergie: 'latte',
  intolleranze: '', autorizzazione1: 1, autorizzazione2: 0, autorizzazione3: 1,
  autorizzazione4: 1, autorizzazione5: 0, consenso: 1,
};

const del = {
  id: 1, userId: '7', nomeDelegato1: 'Zia', cognomeDelegato1: 'Pina',
  documentoDelegato1: "Carta d'Identita", numeroDocumentoDelegato1: 'CA1',
  nomeDelegato2: '', cognomeDelegato2: '', documentoDelegato2: '', numeroDocumentoDelegato2: '',
  nomeDelegato3: null, cognomeDelegato3: null, documentoDelegato3: null, numeroDocumentoDelegato3: null,
  nomeDelegato4: null, cognomeDelegato4: null, documentoDelegato4: null, numeroDocumentoDelegato4: null,
  consenso: 1,
};

describe('grest legacy import', () => {
  it('maps an active user with both forms', () => {
    const i = mappaIscritto(user, aut, del);
    expect(i).toMatchObject({
      legacyId: 7, username: 'LucaRossi', usernameLower: 'lucarossi', passwordInChiaro: 'segreta',
      attivo: true, nomeMadre: '', uscita1: true, uscita2: false, consenso: true,
    });
    expect(i.autorizzazione).toMatchObject({
      dichiarazione2: true, dichiarazione6: true, allergie: 'latte', autorizzazione2: false, consenso: true,
    });
    expect(i.delega).toEqual({
      consenso: true,
      delegati: [{ nome: 'Zia', cognome: 'Pina', tipoDocumento: "Carta d'Identita", numeroDocumento: 'CA1' }],
    });
  });

  it('drops the activation token of active users and keeps it for pending ones', () => {
    expect(mappaIscritto(user, undefined, undefined).activationToken).toBeUndefined();
    expect(mappaIscritto({ ...user, isActive: 0 }, undefined, undefined).activationToken).toBe('tok');
  });

  it('keeps "never answered" (empty uscita1) distinct from "no"', () => {
    expect(mappaIscritto({ ...user, uscita1: '' }, undefined, undefined).uscita1).toBeNull();
    expect(mappaIscritto({ ...user, uscita1: 0 }, undefined, undefined).uscita1).toBe(false);
  });

  it('mappaExport joins the forms by userId and rejects orphans', () => {
    const out = mappaExport({ users: [user], autorizzazioni: [aut], deleghe: [] });
    expect(out).toHaveLength(1);
    expect(out[0].autorizzazione).not.toBeNull();
    expect(out[0].delega).toBeNull();
    expect(() =>
      mappaExport({ users: [user], autorizzazioni: [{ ...aut, userId: '99' }], deleghe: [] }),
    ).toThrow(/99/);
  });
});
