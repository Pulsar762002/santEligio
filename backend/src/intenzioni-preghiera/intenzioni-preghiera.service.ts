import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IntenzionePreghiera,
  IntenzionePreghieraDocument,
} from './schemas/intenzione-preghiera.schema';
import { CreateIntenzionePreghieraDto } from './dto/create-intenzione-preghiera.dto';
import { UpdateIntenzionePreghieraDto } from './dto/update-intenzione-preghiera.dto';

@Injectable()
export class IntenzioniPreghieraService {
  constructor(
    @InjectModel(IntenzionePreghiera.name)
    private intenzioneModel: Model<IntenzionePreghieraDocument>,
  ) {}

  create(dto: CreateIntenzionePreghieraDto) {
    return this.intenzioneModel.create(dto);
  }

  findAll() {
    return this.intenzioneModel.find().sort({ createdAt: -1 });
  }

  async update(id: string, dto: UpdateIntenzionePreghieraDto) {
    const item = await this.intenzioneModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.intenzioneModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
