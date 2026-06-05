import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evento, EventoDocument } from './schemas/evento.schema';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventiService {
  constructor(@InjectModel(Evento.name) private eventoModel: Model<EventoDocument>) {}

  findAll(soloPublicati = true) {
    const filter = soloPublicati ? { pubblicato: true } : {};
    return this.eventoModel.find(filter).sort({ dataInizio: 1 });
  }

  findProssimi(limit = 5) {
    const now = new Date();
    return this.eventoModel
      .find({
        pubblicato: true,
        $or: [
          { dataFine: { $gte: now } },
          { dataFine: { $exists: false }, dataInizio: { $gte: now } },
        ],
      })
      .sort({ dataInizio: 1 })
      .limit(limit);
  }

  async findOne(id: string) {
    const item = await this.eventoModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateEventoDto) {
    return this.eventoModel.create(dto);
  }

  async update(id: string, dto: UpdateEventoDto) {
    const item = await this.eventoModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.eventoModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
