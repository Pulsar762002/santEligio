import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CalendarioAttivita,
  CalendarioAttivitaDocument,
  TipoAttivita,
  FonteAttivita,
} from './schemas/calendario-attivita.schema';
import { OrarioMessa, OrarioMessaDocument } from '../orari-messe/schemas/orario-messa.schema';
import { Evento, EventoDocument } from '../eventi/schemas/evento.schema';
import { CreateCalendarioAttivitaDto } from './dto/create-calendario-attivita.dto';
import { UpdateCalendarioAttivitaDto } from './dto/update-calendario-attivita.dto';

const WEEKDAY_KEYWORDS: [string, number][] = [
  ['lune', 1],
  ['marte', 2],
  ['mercole', 3],
  ['giove', 4],
  ['venerd', 5],
  ['sabat', 6],
  ['domenic', 0],
];

export function weekdaysFromGiorno(giorno: string): number[] {
  const normalized = giorno.toLowerCase();
  return WEEKDAY_KEYWORDS.filter(([keyword]) => normalized.includes(keyword)).map(([, weekday]) => weekday);
}

function romeDateParts(date: Date): { anno: number; mese: number; giorno: number; ora: string } {
  const parts = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  return {
    anno: Number(parts.year),
    mese: Number(parts.month),
    giorno: Number(parts.day),
    ora: `${parts.hour}:${parts.minute}`,
  };
}

@Injectable()
export class CalendarioAttivitaService {
  constructor(
    @InjectModel(CalendarioAttivita.name) private calendarioModel: Model<CalendarioAttivitaDocument>,
    @InjectModel(OrarioMessa.name) private orarioModel: Model<OrarioMessaDocument>,
    @InjectModel(Evento.name) private eventoModel: Model<EventoDocument>,
  ) {}

  private meseRange(anno: number, mese: number) {
    return { start: new Date(anno, mese - 1, 1), end: new Date(anno, mese, 1) };
  }

  findAll(anno: number, mese: number, tutti = false) {
    const { start, end } = this.meseRange(anno, mese);
    const filter: any = { data: { $gte: start, $lt: end } };
    if (!tutti) filter.pubblicato = true;
    return this.calendarioModel.find(filter).sort({ data: 1, ora: 1 });
  }

  async findOne(id: string) {
    const item = await this.calendarioModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateCalendarioAttivitaDto) {
    return this.calendarioModel.create({
      ...dto,
      fonte: FonteAttivita.MANUALE,
      fonteRifId: undefined,
    });
  }

  async update(id: string, dto: UpdateCalendarioAttivitaDto) {
    const item = await this.calendarioModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.calendarioModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }

  async generaMese(anno: number, mese: number) {
    const { start, end } = this.meseRange(anno, mese);

    const orari = await this.orarioModel.find({ attivo: true });
    for (const orario of orari) {
      const weekdays = weekdaysFromGiorno(orario.giorno);
      if (!weekdays.length) continue;
      const oreSingole = orario.ora.split(',').map(o => o.trim()).filter(Boolean);

      for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        if (!weekdays.includes(d.getDay())) continue;
        const dataGiorno = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        for (const ora of oreSingole) {
          const esiste = await this.calendarioModel.exists({
            fonte: FonteAttivita.MESSA,
            fonteRifId: String(orario._id),
            data: dataGiorno,
            ora,
          });
          if (esiste) continue;

          await this.calendarioModel.create({
            data: dataGiorno,
            ora,
            titolo: 'Santa Messa',
            tipo: TipoAttivita.MESSA,
            luogo: orario.chiesa,
            note: orario.note,
            fonte: FonteAttivita.MESSA,
            fonteRifId: String(orario._id),
            pubblicato: true,
          });
        }
      }
    }

    const eventi = await this.eventoModel.find({
      pubblicato: true,
      dataInizio: { $gte: start, $lt: end },
    });
    for (const evento of eventi) {
      const esiste = await this.calendarioModel.exists({
        fonte: FonteAttivita.EVENTO,
        fonteRifId: String(evento._id),
      });
      if (esiste) continue;

      const { anno: ea, mese: em, giorno: eg, ora } = romeDateParts(evento.dataInizio);

      await this.calendarioModel.create({
        data: new Date(ea, em - 1, eg),
        ora,
        titolo: evento.titolo,
        tipo: TipoAttivita.EVENTO,
        luogo: evento.luogo,
        fonte: FonteAttivita.EVENTO,
        fonteRifId: String(evento._id),
        pubblicato: true,
      });
    }

    return this.findAll(anno, mese, true);
  }
}
