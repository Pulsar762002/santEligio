import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Strada, StradaDocument } from './schemas/strada.schema';
import { CreateStradaDto } from './dto/create-strada.dto';
import { UpdateStradaDto } from './dto/update-strada.dto';

@Injectable()
export class StradarioService {
  constructor(@InjectModel(Strada.name) private stradaModel: Model<StradaDocument>) {}

  findAll() {
    return this.stradaModel.find().sort({ contrada: 1, via: 1 });
  }

  create(dto: CreateStradaDto) {
    return this.stradaModel.create(dto);
  }

  async update(id: string, dto: UpdateStradaDto) {
    const item = await this.stradaModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.stradaModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
