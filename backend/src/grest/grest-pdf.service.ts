import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import * as JSZip from 'jszip';
import { GrestIscritto } from './schemas/grest-iscritto.schema';
import { ModuloGrest } from './grest.constants';

export type Segnaposti = Record<string, string | number | undefined>;

// {{ chiave }} nel content.xml dei template ODT (stessa regex del vecchio portale).
const SEGNAPOSTO_RE = /\{\{\s*([\w_]+(?:\s+[\w_]+)*)\s*\}\}/gs;

const SI_BARRATO = '<text:span text:style-name="TestoBarrato">SI</text:span>     NO';
const NO_BARRATO = 'SI     <text:span text:style-name="TestoBarrato">NO</text:span>';

export function escapeXml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Data odierna gg/mm/aaaa nel fuso italiano. */
export function oggi(now = new Date()): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(now);
}

const b = (v: boolean | null | undefined) => (v ? 1 : 0);

// ── Valori dei segnaposto, letti dal DB (prima li mandava il browser). ──
// Le chiavi sono quelle dei template *_2026.odt.

export function segnapostiIscrizione(i: GrestIscritto, now = new Date()): Segnaposti {
  return {
    nome_padre: i.nomePadre,
    cognome_padre: i.cognomePadre,
    cellulare_padre: i.mobilePhonePadre,
    nome_madre: i.nomeMadre,
    cognome_madre: i.cognomeMadre,
    cellulare_madre: i.mobilePhoneMadre,
    nome_figlio: i.nomeFiglio,
    cognome_figlio: i.cognomeFiglio,
    comune_nascita: i.natoA,
    data_nascita: i.natoIl,
    comune_residenza: i.residenteA,
    via_residenza: i.via,
    anno_iscrizione: i.annoCatechismo,
    annoi_classe: i.annoElementari,
    nome_cognome_altro_contatto: i.altroContatto,
    cellulare_altro_contatto: i.mobilePhoneAltro,
    note: i.altroDaSegnalare,
    taglia_tshirt: i.taglia,
    g1: i.uscita1 ? ' - X' : '',
    data_corrente: oggi(now),
  };
}

export function segnapostiAutorizzazione(i: GrestIscritto): Segnaposti {
  const a = i.autorizzazione!;
  const entrambi = i.nomePadre && i.cognomePadre && i.nomeMadre && i.cognomeMadre;
  return {
    nome_autorizzatore: `${i.nomePadre} ${i.cognomePadre}`,
    cognome_autorizzatore: entrambi
      ? `e ${i.nomeMadre} ${i.cognomeMadre}`
      : `${i.nomeMadre} ${i.cognomeMadre}`,
    nome_figlio: i.nomeFiglio,
    cognome_figlio: i.cognomeFiglio,
    _1: b(a.dichiarazione1),
    _2: b(a.dichiarazione2),
    _3: b(a.dichiarazione3),
    _4: b(a.dichiarazione4),
    _5: b(a.dichiarazione5),
    _6: b(a.dichiarazione6),
    _7: b(a.dichiarazione7),
    _8: b(a.autorizzazione1),
    _9: b(a.autorizzazione2),
    _10: b(a.autorizzazione3),
    _11: b(a.autorizzazione4),
    _12: b(a.consenso),
    _allergie: a.allergie,
    _intolleranze: a.intolleranze,
  };
}

export function segnapostiDelega(i: GrestIscritto, now = new Date()): Segnaposti {
  const s: Segnaposti = {
    nome_padre: i.nomePadre,
    cognome_padre: i.cognomePadre,
    nome_madre: i.nomeMadre,
    cognome_madre: i.cognomeMadre,
    nome_figlio: i.nomeFiglio,
    cognome_figlio: i.cognomeFiglio,
    comune_nascita: i.natoA,
    data_nascita: i.natoIl,
    data_odierna: oggi(now),
  };
  (i.delega?.delegati ?? []).slice(0, 4).forEach((d, idx) => {
    const n = idx + 1;
    s[`_nome_delegato${n}`] = d.nome;
    s[`cognome_delegato${n}`] = d.cognome;
    s[`tipo_doc${n}`] = d.tipoDocumento;
    s[`numero_doc${n}`] = d.numeroDocumento;
  });
  return s;
}

/** Sostituisce i segnaposto nel content.xml come faceva il vecchio generatePDF. */
export function compilaXml(xml: string, v: Segnaposti): string {
  return xml.replace(SEGNAPOSTO_RE, (_match, key: string) => {
    const value = v[key];

    if (key === 'new') return '<text:p text:style-name="P1"><text:soft-page-break/></text:p>';

    if (key.startsWith('_')) {
      // Sì/No con allergie/intolleranze accanto quando la risposta è Sì.
      if (key === '_2' || key === '_3') {
        const extra = escapeXml(v[key === '_2' ? '_allergie' : '_intolleranze']);
        return value === 1 ? `${SI_BARRATO}             ${extra}` : NO_BARRATO;
      }
      const delegato = /^_nome_delegato([1-4])$/.exec(key);
      if (delegato) {
        const n = delegato[1];
        if (!v[key]) return '';
        return escapeXml(
          `${v[key] ?? ''} ${v[`cognome_delegato${n}`] ?? ''}    Documento  - ` +
            `${v[`tipo_doc${n}`] ?? ''}   ${v[`numero_doc${n}`] ?? ''}`,
        );
      }
      if (value === 1) return SI_BARRATO;
      if (value === 0) return NO_BARRATO;
      return '';
    }

    return value !== undefined ? escapeXml(value) : '';
  });
}

@Injectable()
export class GrestPdfService {
  private readonly logger = new Logger(GrestPdfService.name);

  constructor(private readonly config: ConfigService) {}

  segnaposti(modulo: ModuloGrest, iscritto: GrestIscritto): Segnaposti {
    switch (modulo) {
      case 'iscrizione': return segnapostiIscrizione(iscritto);
      case 'autorizzazione': return segnapostiAutorizzazione(iscritto);
      case 'delega': return segnapostiDelega(iscritto);
    }
  }

  /** ODT compilato in memoria (nessun file condiviso tra richieste). */
  async compilaOdt(modulo: ModuloGrest, valori: Segnaposti): Promise<Buffer> {
    const anno = this.config.get<string>('GREST_ANNO', '2026');
    const template = join(process.cwd(), 'assets', 'grest', `${modulo}_${anno}.odt`);
    const zip = await JSZip.loadAsync(await readFile(template));
    const xml = await zip.file('content.xml')!.async('string');
    zip.file('content.xml', compilaXml(xml, valori));
    return zip.generateAsync({ type: 'nodebuffer', mimeType: 'application/vnd.oasis.opendocument.text' });
  }

  /** Converte in PDF con Gotenberg (LibreOffice in un container dedicato). */
  async inPdf(odt: Buffer): Promise<Buffer> {
    const url = this.config.get<string>('GOTENBERG_URL', 'http://gotenberg:3000');
    const form = new FormData();
    form.append('files', new Blob([new Uint8Array(odt)]), 'modulo.odt');
    try {
      const res = await fetch(`${url}/forms/libreoffice/convert`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Gotenberg HTTP ${res.status}: ${await res.text()}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      this.logger.error(`Conversione PDF fallita: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Generazione del PDF non riuscita, riprova tra poco.');
    }
  }

  async genera(modulo: ModuloGrest, iscritto: GrestIscritto): Promise<Buffer> {
    return this.inPdf(await this.compilaOdt(modulo, this.segnaposti(modulo, iscritto)));
  }
}
