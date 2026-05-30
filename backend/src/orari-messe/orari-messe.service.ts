import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrarioMessa, OrarioMessaDocument, TipoMessa } from './schemas/orario-messa.schema';
import { CreateOrarioMessaDto } from './dto/create-orario-messa.dto';
import { UpdateOrarioMessaDto } from './dto/update-orario-messa.dto';

@Injectable()
export class OrariMesseService {
  constructor(
    @InjectModel(OrarioMessa.name) private orarioModel: Model<OrarioMessaDocument>,
  ) {}

  findAll(tipo?: TipoMessa) {
    const filter: any = { attivo: true };
    if (tipo) filter.tipo = tipo;
    return this.orarioModel.find(filter).sort({ ordine: 1, ora: 1 });
  }

  async findOne(id: string) {
    const item = await this.orarioModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateOrarioMessaDto) {
    return this.orarioModel.create(dto);
  }

  async update(id: string, dto: UpdateOrarioMessaDto) {
    const item = await this.orarioModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.orarioModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
