import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News, NewsDocument, CategoriaNews } from './schemas/news.schema';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(@InjectModel(News.name) private newsModel: Model<NewsDocument>) {}

  findAll(categoria?: CategoriaNews, soloPublicati = true) {
    const filter: any = {};
    if (soloPublicati) filter.pubblicato = true;
    if (categoria) filter.categoria = categoria;
    return this.newsModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const item = await this.newsModel.findById(id);
    if (!item) throw new NotFoundException();
    return item;
  }

  create(dto: CreateNewsDto) {
    return this.newsModel.create(dto);
  }

  async update(id: string, dto: UpdateNewsDto) {
    const item = await this.newsModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException();
    return item;
  }

  async remove(id: string) {
    const item = await this.newsModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
  }
}
