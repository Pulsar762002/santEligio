import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gruppo, GruppoDocument, AreaGruppo } from './schemas/gruppo.schema';
import { CreateGruppoDto } from './dto/create-gruppo.dto';
import { UpdateGruppoDto } from './dto/update-gruppo.dto';

@Injectable()
export class GruppiService {
  constructor(@InjectModel(Gruppo.name) private gruppoModel: Model<GruppoDocument>) {}

  findAll(area?: AreaGruppo, soloPubblicati = true) {
    const filter: any = {};
    if (soloPubblicati) filter.pubblicato = true;
    if (area) filter.area = area;
    return this.gruppoModel.find(filter).sort({ area: 1, ordine: 1 });
  }

  async findOne(id: string) {
    const item = await this.gruppoModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateGruppoDto) {
    return this.gruppoModel.create(dto);
  }

  async update(id: string, dto: UpdateGruppoDto) {
    const item = await this.gruppoModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.gruppoModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
