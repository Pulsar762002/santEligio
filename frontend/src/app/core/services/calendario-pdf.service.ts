import { Injectable, inject } from '@angular/core';
import { forkJoin, of, catchError } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalendarioAttivita, COLORE_ATTIVITA_HEX } from '../models/calendario-attivita.model';
import { OrarioMessa } from '../models/orario-messa.model';
import { OrariMesseService } from './orari-messe.service';
import { CalendarioIntestazione } from '../models/calendario-intestazione.model';
import { CalendarioIntestazioniService } from './calendario-intestazioni.service';
import { SANTI_DEL_GIORNO } from '../data/santi-del-giorno.data';
import { SOCIAL_ICONE } from '../data/social-icone.data';
import { FESTIVI_FISSI } from '../data/festivi-fissi.data';

export interface GiornoAgenda {
  data: string;
  voci: CalendarioAttivita[];
}

interface RigaTesto {
  testo: string;
  colore: [number, number, number];
  grassetto: boolean;
  corsivo: boolean;
}

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const COLONNA0_LARGHEZZA = 140;
const CELL_PADDING = 6;
const INTESTAZIONE_TITOLO_FONT = 11.5;
const INTESTAZIONE_TITOLO_INTERLINEA = 14;
const INTESTAZIONE_DESCR_FONT = 9.5;
const INTESTAZIONE_DESCR_INTERLINEA = 11.5;
const INTESTAZIONE_GAP = 4;

@Injectable({ providedIn: 'root' })
export class CalendarioPdfService {
  private readonly orariService = inject(OrariMesseService);
  private readonly intestazioniService = inject(CalendarioIntestazioniService);

  genera(anno: number, mese: number, giorni: GiornoAgenda[]): void {
    forkJoin({
      orari: this.orariService.getAll().pipe(catchError(() => of([] as OrarioMessa[]))),
      intestazione: this.intestazioniService.get(anno, mese).pipe(catchError(() => of(null))),
    }).subscribe(({ orari, intestazione }) => this.costruisci(anno, mese, giorni, orari, intestazione));
  }

  private async costruisci(
    anno: number,
    mese: number,
    giorni: GiornoAgenda[],
    orari: OrarioMessa[],
    intestazione: CalendarioIntestazione | null,
  ): Promise<void> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 55;

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(26);
    doc.setTextColor(70, 20, 20);
    doc.text('Parrocchia S. Eligio', pageWidth / 2, y, { align: 'center' });

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70);
    doc.text('Diocesi di Roma – Settore Est – XVIII Prefettura', pageWidth / 2, y, { align: 'center' });

    y += 26;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0);
    doc.text('CALENDARIO CELEBRAZIONI E ATTIVITÀ', pageWidth / 2, y, { align: 'center' });

    y += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor(40);
    const orariLinea = this.formattaOrariMesse(orari);
    const orariWrapped = doc.splitTextToSize(orariLinea, pageWidth - marginX * 2) as string[];
    doc.text(orariWrapped, pageWidth / 2, y, { align: 'center' });
    y += orariWrapped.length * 12 + 2;

    const meseLabel = `${MESI[mese - 1].toUpperCase()} ${anno}`;
    const giorniFiltrati = giorni
      .map(g => ({
        data: g.data,
        voci: g.voci.filter(v => v.tipo !== 'messa' || this.isGiornoFestivo(g.data)),
      }))
      .filter(g => g.voci.length > 0);
    const righe = giorniFiltrati.map(g => ({
      giorno: this.formattaGiorno(g.data),
      santo: SANTI_DEL_GIORNO[g.data.slice(5, 10)],
    }));

    const colonna1Larghezza = pageWidth - marginX * 2 - COLONNA0_LARGHEZZA - CELL_PADDING * 2;
    const righeAttivita = giorniFiltrati.map(g => this.costruisciRigheVoci(g.voci, colonna1Larghezza, doc));
    const body: (string | { content: string; colSpan: number })[][] = giorniFiltrati.map((g, i) => [righe[i].giorno, '']);

    // Intestazione del mese (titolo + descrizione) come prima riga del corpo, a tutta larghezza:
    // sta subito sotto la riga del mese e, a differenza dell'head, non si ripete sulle pagine successive.
    const larghezzaIntestazione = pageWidth - marginX * 2 - CELL_PADDING * 2;
    const intestazioneTitolo = intestazione?.titolo?.trim()
      ? this.righeTesto(doc, intestazione.titolo.trim(), 'bold', INTESTAZIONE_TITOLO_FONT, larghezzaIntestazione)
      : [];
    const intestazioneDescr = intestazione?.descrizione?.trim()
      ? this.righeTesto(doc, intestazione.descrizione.trim(), 'normal', INTESTAZIONE_DESCR_FONT, larghezzaIntestazione)
      : [];
    const offset = intestazioneTitolo.length || intestazioneDescr.length ? 1 : 0;
    if (offset) body.unshift([{ content: '', colSpan: 2 }]);

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX, bottom: 60 },
      // Il contenuto delle celle è disegnato a mano in didDrawCell: una riga spezzata tra due pagine
      // verrebbe comunque disegnata per intero e finirebbe sopra il piè di pagina. Meglio spostarla tutta.
      rowPageBreak: 'avoid',
      head: [[{ content: meseLabel, colSpan: 2, styles: { halign: 'center' as const } }]],
      body,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 6, valign: 'top', lineColor: [180, 180, 180], textColor: [20, 20, 20] },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 12, lineColor: [0, 0, 0] },
      columnStyles: { 0: { cellWidth: COLONNA0_LARGHEZZA, fontStyle: 'bold' }, 1: { cellWidth: 'auto' } },
      didParseCell: data => {
        if (data.section !== 'body') return;
        if (data.row.index < offset) {
          data.cell.text = [];
          const gap = intestazioneTitolo.length && intestazioneDescr.length ? INTESTAZIONE_GAP : 0;
          data.cell.styles.minCellHeight = CELL_PADDING * 2 + 4
            + intestazioneTitolo.length * INTESTAZIONE_TITOLO_INTERLINEA
            + gap
            + intestazioneDescr.length * INTESTAZIONE_DESCR_INTERLINEA;
          return;
        }
        const idx = data.row.index - offset;
        if (data.column.index === 0) {
          const santo = righe[idx]?.santo;
          if (santo) {
            data.cell.text = [];
            const larghezza = COLONNA0_LARGHEZZA - CELL_PADDING * 2;
            const righeSanto = doc.splitTextToSize(santo, larghezza) as string[];
            data.cell.styles.minCellHeight = CELL_PADDING * 2 + 12 + righeSanto.length * 10 + 4;
          }
        } else if (data.column.index === 1) {
          data.cell.text = [];
          const numeroRighe = righeAttivita[idx]?.length ?? 1;
          data.cell.styles.minCellHeight = CELL_PADDING * 2 + numeroRighe * 11;
        }
      },
      didDrawCell: data => {
        if (data.section !== 'body') return;
        if (data.row.index < offset) {
          const cx = data.cell.x + data.cell.width / 2;
          let ty = data.cell.y + data.cell.padding('top') + 9;
          doc.setTextColor(0, 0, 0);
          if (intestazioneTitolo.length) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(INTESTAZIONE_TITOLO_FONT);
            for (const r of intestazioneTitolo) {
              doc.text(r, cx, ty, { align: 'center' });
              ty += INTESTAZIONE_TITOLO_INTERLINEA;
            }
            if (intestazioneDescr.length) ty += INTESTAZIONE_GAP;
          }
          if (intestazioneDescr.length) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(INTESTAZIONE_DESCR_FONT);
            doc.setTextColor(40, 40, 40);
            for (const r of intestazioneDescr) {
              doc.text(r, cx, ty, { align: 'center' });
              ty += INTESTAZIONE_DESCR_INTERLINEA;
            }
          }
          return;
        }
        const idx = data.row.index - offset;
        if (data.column.index === 0) {
          const santo = righe[idx]?.santo;
          if (santo) {
            const x = data.cell.x + data.cell.padding('left');
            const larghezza = data.cell.width - data.cell.padding('left') - data.cell.padding('right');
            let ty = data.cell.y + data.cell.padding('top') + 8;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(20, 20, 20);
            doc.text(righe[idx].giorno, x, ty);
            ty += 12;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(90, 90, 90);
            doc.text(doc.splitTextToSize(santo, larghezza), x, ty);
          }
        } else if (data.column.index === 1) {
          const x = data.cell.x + data.cell.padding('left');
          let ty = data.cell.y + data.cell.padding('top') + 8;
          doc.setFontSize(9.5);
          for (const riga of righeAttivita[idx] ?? []) {
            doc.setFont('helvetica', this.fontStyleDa(riga.grassetto, riga.corsivo));
            doc.setTextColor(...riga.colore);
            doc.text(riga.testo, x, ty);
            ty += 11;
          }
        }
      },
      didDrawPage: () => this.disegnaFooter(doc),
    });

    if (giorniFiltrati.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(90);
      const fineTabella = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
      doc.text('Nessuna attività in programma per questo mese.', pageWidth / 2, fineTabella + 30, { align: 'center' });
      this.disegnaFooter(doc);
    }

    await this.salvaOCondividi(doc, `calendario-${MESI[mese - 1].toLowerCase()}-${anno}.pdf`);
  }

  private async salvaOCondividi(doc: jsPDF, nomeFile: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Browser: il download standard funziona senza problemi.
      doc.save(nomeFile);
      return;
    }

    // Nell'app (WebView) un <a download> su un blob: non avvia alcun
    // download: si scrive il PDF nella cache dell'app e si apre il foglio
    // di condivisione nativo, da cui l'utente può salvarlo o inviarlo.
    const base64 = doc.output('datauristring').split(',')[1];
    const { uri } = await Filesystem.writeFile({
      path: nomeFile,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({
      title: nomeFile,
      url: uri,
      dialogTitle: 'Salva o condividi il calendario',
    });
  }

  private disegnaFooter(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const yContatti = pageHeight - 40;

    doc.setDrawColor(180);
    doc.line(40, yContatti - 12, pageWidth - 40, yContatti - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70);
    doc.text(
      "Via Fosso dell'Osa, 435 – 00132 Roma (RM) · Tel. 06 2261045 · info@parrocchiasanteligio.it",
      pageWidth / 2,
      yContatti,
      { align: 'center' },
    );

    this.disegnaSocial(doc, pageWidth / 2, yContatti + 13);
  }

  private disegnaSocial(doc: jsPDF, centerX: number, y: number): void {
    const gruppi: { icona: keyof typeof SOCIAL_ICONE; testo: string }[] = [
      { icona: 'facebook', testo: 'S.EligioRoma' },
      { icona: 'x', testo: 'S_EligioRoma' },
      { icona: 'instagram', testo: 'parrocchias.eligio' },
      { icona: 'youtube', testo: 'Parrocchia S. Eligio - Diocesi di Roma' },
    ];
    const iconSize = 7;
    const gapIconTesto = 3;
    const gapGruppi = 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90);

    const larghezze = gruppi.map(g => iconSize + gapIconTesto + doc.getTextWidth(g.testo));
    const larghezzaTotale = larghezze.reduce((a, b) => a + b, 0) + gapGruppi * (gruppi.length - 1);

    let x = centerX - larghezzaTotale / 2;
    gruppi.forEach((g, i) => {
      doc.addImage(SOCIAL_ICONE[g.icona], 'PNG', x, y - iconSize + 1.5, iconSize, iconSize);
      doc.text(g.testo, x + iconSize + gapIconTesto, y);
      x += larghezze[i] + gapGruppi;
    });
  }

  private isGiornoFestivo(data: string): boolean {
    const giornoSettimana = new Date(`${data}T00:00:00`).getDay();
    return giornoSettimana === 0 || giornoSettimana === 6 || FESTIVI_FISSI.includes(data.slice(5, 10));
  }

  private formattaGiorno(data: string): string {
    const d = new Date(`${data}T00:00:00`);
    const giornoSettimana = d.toLocaleDateString('it-IT', { weekday: 'long' });
    const capitalizzato = giornoSettimana.charAt(0).toUpperCase() + giornoSettimana.slice(1);
    return `${capitalizzato}, ${d.getDate()}`;
  }

  private costruisciRigheVoci(voci: CalendarioAttivita[], larghezza: number, doc: jsPDF): RigaTesto[] {
    const righe: RigaTesto[] = [];
    for (const v of voci) {
      const colore = this.hexARgb(COLORE_ATTIVITA_HEX[v.colore ?? 'nero']);
      const grassetto = !!v.grassetto;
      const corsivo = !!v.corsivo;
      doc.setFont('helvetica', this.fontStyleDa(grassetto, corsivo));
      doc.setFontSize(9.5);

      let testo = `${v.ora} ${v.titolo}`;
      if (v.luogo) testo += ` (${v.luogo})`;
      for (const riga of doc.splitTextToSize(testo, larghezza) as string[]) {
        righe.push({ testo: riga, colore, grassetto, corsivo });
      }
      if (v.note) {
        for (const riga of doc.splitTextToSize(v.note, larghezza) as string[]) {
          righe.push({ testo: riga, colore, grassetto, corsivo });
        }
      }
    }
    return righe;
  }

  private fontStyleDa(grassetto: boolean, corsivo: boolean): string {
    if (grassetto && corsivo) return 'bolditalic';
    if (grassetto) return 'bold';
    if (corsivo) return 'italic';
    return 'normal';
  }

  private hexARgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  /** Spezza il testo (rispettando gli a capo inseriti dall'admin) in righe che stanno nella larghezza data. */
  private righeTesto(doc: jsPDF, testo: string, stile: 'bold' | 'normal', fontSize: number, larghezza: number): string[] {
    doc.setFont('helvetica', stile);
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(testo, larghezza) as string[];
  }

  private formattaOrariMesse(orari: OrarioMessa[]): string {
    const attivi = orari.filter(o => o.attivo);
    if (attivi.length === 0) return '';

    const gruppi: { giorno: string; ore: string[] }[] = [];
    for (const o of attivi) {
      const ultimo = gruppi[gruppi.length - 1];
      if (ultimo && ultimo.giorno === o.giorno) {
        ultimo.ore.push(o.ora);
      } else {
        gruppi.push({ giorno: o.giorno, ore: [o.ora] });
      }
    }

    const parti = gruppi.map(g => `${g.giorno} ${g.ore.join(' - ')}`);
    return `Orari SS. Messe: ${parti.join(', ')}`;
  }
}
