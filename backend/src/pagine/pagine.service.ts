import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pagina, PaginaDocument, SezionePagina } from './schemas/pagina.schema';
import { CreatePaginaDto } from './dto/create-pagina.dto';
import { UpdatePaginaDto } from './dto/update-pagina.dto';

@Injectable()
export class PagineService {
  constructor(@InjectModel(Pagina.name) private paginaModel: Model<PaginaDocument>) {}

  findAll(sezione?: SezionePagina, soloPubblicate = true) {
    const filter: any = {};
    if (soloPubblicate) filter.pubblicato = true;
    if (sezione) filter.sezione = sezione;
    return this.paginaModel.find(filter).sort({ sezione: 1, ordine: 1 });
  }

  async findBySlug(slug: string) {
    const item = await this.paginaModel.findOne({ slug });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreatePaginaDto) {
    return this.paginaModel.create(dto);
  }

  async update(id: string, dto: UpdatePaginaDto) {
    const item = await this.paginaModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.paginaModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
