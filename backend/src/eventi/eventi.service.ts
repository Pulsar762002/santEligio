import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Evento, EventoDocument } from './schemas/evento.schema';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

type DateEvento = {
  dataInizio?: Date | string | null;
  dataFine?: Date | string | null;
  visibileDal?: Date | string | null;
  visibileFino?: Date | string | null;
};

const ms = (d?: Date | string | null) => (d ? new Date(d).getTime() : undefined);

/**
 * Controlla la coerenza delle date di un evento (già unite ai valori salvati, in modifica):
 * la fine non può precedere l'inizio, né "visibile fino al" precedere "visibile dal".
 */
export function verificaDateEvento(e: DateEvento): void {
  const [inizio, fine, dal, fino] = [ms(e.dataInizio), ms(e.dataFine), ms(e.visibileDal), ms(e.visibileFino)];
  if (inizio !== undefined && fine !== undefined && fine < inizio) {
    throw new BadRequestException("La data di fine dell'evento è precedente all'inizio.");
  }
  if (dal !== undefined && fino !== undefined && fino < dal) {
    throw new BadRequestException('Il periodo di visibilità termina prima di cominciare.');
  }
}

/** In modifica: confronta le date nuove con quelle salvate (null nel DTO = campo svuotato). */
export function verificaDateModifica(attuale: DateEvento, dto: DateEvento): void {
  const campo = <K extends keyof DateEvento>(k: K) => (dto[k] !== undefined ? dto[k] : attuale[k]);
  verificaDateEvento({
    dataInizio: campo('dataInizio'),
    dataFine: campo('dataFine'),
    visibileDal: campo('visibileDal'),
    visibileFino: campo('visibileFino'),
  });
}

/** Eventi mostrati al pubblico: pubblicati e dentro il periodo di visibilità (se impostato). */
export function filtroVisibile(now = new Date()): FilterQuery<EventoDocument> {
  return {
    pubblicato: true,
    $and: [
      { $or: [{ visibileDal: null }, { visibileDal: { $lte: now } }] },
      { $or: [{ visibileFino: null }, { visibileFino: { $gte: now } }] },
    ],
  };
}

/** Eventi non ancora terminati (in corso o futuri). */
function filtroNonTerminato(now: Date): FilterQuery<EventoDocument> {
  return {
    $or: [
      { dataFine: { $gte: now } },
      { dataFine: { $exists: false }, dataInizio: { $gte: now } },
    ],
  };
}

@Injectable()
export class EventiService {
  constructor(@InjectModel(Evento.name) private eventoModel: Model<EventoDocument>) {}

  findAll(soloPublicati = true) {
    const filter = soloPublicati ? filtroVisibile() : {};
    return this.eventoModel.find(filter).sort({ dataInizio: 1 });
  }

  async findProssimi(limit = 5, mesiFinestra = 2) {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() + mesiFinestra);

    const filtroBase = { ...filtroVisibile(now), ...filtroNonTerminato(now) };

    const entroFinestra = await this.eventoModel
      .find({ ...filtroBase, dataInizio: { $lte: cutoff } })
      .sort({ dataInizio: 1 });

    if (entroFinestra.length >= limit) {
      return entroFinestra;
    }

    return this.eventoModel.find(filtroBase).sort({ dataInizio: 1 }).limit(limit);
  }

  /** Eventi in evidenza non ancora terminati, per la home e la testa di /eventi. */
  findInEvidenza() {
    const now = new Date();
    return this.eventoModel
      .find({ ...filtroVisibile(now), ...filtroNonTerminato(now), inEvidenza: true })
      .sort({ dataInizio: 1 });
  }

  async findOne(id: string) {
    const item = await this.eventoModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateEventoDto) {
    verificaDateEvento(dto);
    return this.eventoModel.create(dto);
  }

  async update(id: string, dto: UpdateEventoDto) {
    const item = await this.eventoModel.findById(id);
    if (!item) throw new NotFoundException();
    verificaDateModifica(item, dto);
    item.set(dto);
    return item.save();
  }

  async remove(id: string) {
    const item = await this.eventoModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
