import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CalendarioIntestazione,
  CalendarioIntestazioneDocument,
} from './schemas/calendario-intestazione.schema';
import { SalvaCalendarioIntestazioneDto } from './dto/salva-calendario-intestazione.dto';

@Injectable()
export class CalendarioIntestazioniService {
  constructor(
    @InjectModel(CalendarioIntestazione.name) private intestazioneModel: Model<CalendarioIntestazioneDocument>,
  ) {}

  /** L'intestazione del mese, o null se non è stata impostata. */
  async trova(anno: number, mese: number): Promise<CalendarioIntestazioneDocument | null> {
    return this.intestazioneModel.findOne({ anno, mese }).exec();
  }

  /** Crea o aggiorna l'intestazione del mese; se titolo e descrizione sono vuoti la rimuove. */
  async salva(anno: number, mese: number, dto: SalvaCalendarioIntestazioneDto): Promise<CalendarioIntestazioneDocument | null> {
    const titolo = dto.titolo?.trim() ?? '';
    const descrizione = dto.descrizione?.trim() ?? '';

    if (!titolo && !descrizione) {
      await this.intestazioneModel.deleteOne({ anno, mese }).exec();
      return null;
    }

    return this.intestazioneModel
      .findOneAndUpdate(
        { anno, mese },
        { $set: { titolo, descrizione } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}
