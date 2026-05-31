import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GalleriaCategoria, GalleriaCategoriaDocument } from './schemas/galleria-categoria.schema';
import { GalleriaItem, GalleriaItemDocument } from './schemas/galleria-item.schema';
import { CreateCategoriaDto, UpdateCategoriaDto, CreateItemDto, UpdateItemDto } from './dto/galleria.dto';

function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 120) || 'categoria';
}

@Injectable()
export class GalleriaService {
  constructor(
    @InjectModel(GalleriaCategoria.name) private categoriaModel: Model<GalleriaCategoriaDocument>,
    @InjectModel(GalleriaItem.name) private itemModel: Model<GalleriaItemDocument>,
  ) {}

  // --- categorie ---
  findCategorie() {
    return this.categoriaModel.find().sort({ ordine: 1, nome: 1 });
  }

  createCategoria(dto: CreateCategoriaDto) {
    return this.categoriaModel.create({ ...dto, slug: dto.slug?.trim() || slugify(dto.nome) });
  }

  async updateCategoria(id: string, dto: UpdateCategoriaDto) {
    const item = await this.categoriaModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async removeCategoria(id: string) {
    const cat = await this.categoriaModel.findByIdAndDelete(id);
    if (!cat) throw new NotFoundException();
    // rimuove anche gli item della categoria
    await this.itemModel.deleteMany({ categoria: cat.slug });
  }

  // --- item ---
  findItems(categoria?: string) {
    const filter = categoria ? { categoria } : {};
    return this.itemModel.find(filter).sort({ ordine: 1, createdAt: -1 });
  }

  createItem(dto: CreateItemDto) {
    return this.itemModel.create(dto);
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    const item = await this.itemModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async removeItem(id: string) {
    const item = await this.itemModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
