import * as JSZip from 'jszip';
import {
  GrestPdfService, compilaXml, escapeXml, oggi, segnapostiAutorizzazione, segnapostiDelega, segnapostiIscrizione,
} from './grest-pdf.service';
import { GrestIscritto } from './schemas/grest-iscritto.schema';

const base = {
  nomePadre: 'Mario', cognomePadre: 'Rossi', emailPadre: 'm@r.it', mobilePhonePadre: '333',
  nomeMadre: 'Anna', cognomeMadre: 'Bianchi', emailMadre: '', mobilePhoneMadre: '444',
  nomeFiglio: 'Luca', cognomeFiglio: 'Rossi', natoA: 'Roma', natoIl: '01/02/2016',
  residenteA: 'Roma', via: 'Via Roma 1', annoCatechismo: 'Esterno', annoElementari: '4',
  taglia: '8-9', altroContatto: 'Nonna', mobilePhoneAltro: '555', altroDaSegnalare: 'nessuna',
  uscita1: true, consenso: true,
} as unknown as GrestIscritto;

const now = new Date('2026-03-05T10:00:00Z');

describe('grest pdf', () => {
  it('oggi formats the date in Italian dd/mm/yyyy', () => {
    expect(oggi(now)).toBe('05/03/2026');
  });

  it('segnapostiIscrizione maps the record to the template keys', () => {
    const s = segnapostiIscrizione(base, now);
    expect(s).toMatchObject({
      nome_padre: 'Mario', cellulare_madre: '444', anno_iscrizione: 'Esterno', annoi_classe: '4',
      cellulare_altro_contatto: '555', taglia_tshirt: '8-9', g1: ' - X', data_corrente: '05/03/2026',
    });
    expect(segnapostiIscrizione({ ...base, uscita1: false } as GrestIscritto, now).g1).toBe('');
  });

  it('segnapostiAutorizzazione joins both parents and maps the yes/no answers', () => {
    const i = {
      ...base,
      autorizzazione: {
        dichiarazione1: false, dichiarazione2: true, dichiarazione3: false, dichiarazione4: false,
        dichiarazione5: false, dichiarazione6: true, dichiarazione7: true, dichiarazione8: false,
        allergie: 'arachidi', intolleranze: '', autorizzazione1: true, autorizzazione2: false,
        autorizzazione3: true, autorizzazione4: true, autorizzazione5: false, consenso: true,
      },
    } as GrestIscritto;
    const s = segnapostiAutorizzazione(i);
    expect(s.nome_autorizzatore).toBe('Mario Rossi');
    expect(s.cognome_autorizzatore).toBe('e Anna Bianchi');
    expect([s._1, s._2, s._6, s._7, s._8, s._9, s._10, s._11, s._12]).toEqual([0, 1, 1, 1, 1, 0, 1, 1, 1]);
    expect(s._allergie).toBe('arachidi');
    const soloMadre = segnapostiAutorizzazione({ ...i, nomePadre: '', cognomePadre: '' } as GrestIscritto);
    expect(soloMadre.cognome_autorizzatore).toBe('Anna Bianchi');
  });

  it('segnapostiDelega numbers the delegates from 1', () => {
    const s = segnapostiDelega({
      ...base,
      delega: { consenso: true, delegati: [
        { nome: 'Zia', cognome: 'Pina', tipoDocumento: 'Passaporto', numeroDocumento: 'X1' },
        { nome: 'Zio', cognome: 'Gino', tipoDocumento: 'Patente di guida', numeroDocumento: 'P2' },
      ] },
    } as GrestIscritto, now);
    expect(s).toMatchObject({
      _nome_delegato1: 'Zia', cognome_delegato1: 'Pina', tipo_doc2: 'Patente di guida',
      numero_doc2: 'P2', data_odierna: '05/03/2026', data_nascita: '01/02/2016',
    });
    expect(s._nome_delegato3).toBeUndefined();
  });

  describe('compilaXml', () => {
    it('replaces plain placeholders (tolerating inner spaces) and escapes XML', () => {
      const out = compilaXml('<p>{{nome_figlio}} - {{ cognome_figlio }} - {{assente}}</p>', {
        nome_figlio: 'Luca & <Co>', cognome_figlio: "D'Amico",
      });
      expect(out).toBe('<p>Luca &amp; &lt;Co&gt; - D&apos;Amico - </p>');
    });

    it('renders yes/no answers striking through the chosen option', () => {
      expect(compilaXml('{{_1}}', { _1: 1 })).toBe(
        '<text:span text:style-name="TestoBarrato">SI</text:span>     NO',
      );
      expect(compilaXml('{{_1}}', { _1: 0 })).toBe(
        'SI     <text:span text:style-name="TestoBarrato">NO</text:span>',
      );
    });

    it('appends allergies/intolerances only when the answer is yes', () => {
      expect(compilaXml('{{_2}}', { _2: 1, _allergie: 'latte' })).toBe(
        '<text:span text:style-name="TestoBarrato">SI</text:span>     NO             latte',
      );
      expect(compilaXml('{{_3}}', { _3: 0, _intolleranze: 'glutine' })).toBe(
        'SI     <text:span text:style-name="TestoBarrato">NO</text:span>',
      );
    });

    it('writes delegate lines like the old portal and leaves empty rows blank', () => {
      const v = { _nome_delegato1: 'Zia', cognome_delegato1: 'Pina', tipo_doc1: 'Passaporto', numero_doc1: 'X1' };
      expect(compilaXml('{{_nome_delegato1}}|{{_nome_delegato2}}', v)).toBe(
        'Zia Pina    Documento  - Passaporto   X1|',
      );
    });
  });

  it('escapeXml handles null/undefined', () => {
    expect(escapeXml(undefined)).toBe('');
    expect(escapeXml(null)).toBe('');
  });
});

describe('GrestPdfService.compilaOdt', () => {
  // Usa i template veri in assets/grest (jest gira con cwd = backend/).
  const service = new GrestPdfService({ get: (_k: string, d?: unknown) => d } as any);

  it.each(['iscrizione', 'autorizzazione', 'delega'] as const)(
    'fills every placeholder of the real %s template',
    async (modulo) => {
      const iscritto = {
        ...base,
        autorizzazione: {
          dichiarazione1: false, dichiarazione2: true, dichiarazione3: false, dichiarazione4: false,
          dichiarazione5: false, dichiarazione6: true, dichiarazione7: true, dichiarazione8: false,
          allergie: 'latte', intolleranze: '', autorizzazione1: true, autorizzazione2: true,
          autorizzazione3: true, autorizzazione4: true, autorizzazione5: false, consenso: true,
        },
        delega: { consenso: true, delegati: [
          { nome: 'Zia', cognome: 'Pina', tipoDocumento: 'Passaporto', numeroDocumento: 'X1' },
        ] },
      } as GrestIscritto;
      const odt = await service.compilaOdt(modulo, service.segnaposti(modulo, iscritto));
      const xml = await (await JSZip.loadAsync(odt)).file('content.xml')!.async('string');
      expect(xml).not.toMatch(/\{\{/);
      expect(xml).toContain('Luca');
    },
  );
});
