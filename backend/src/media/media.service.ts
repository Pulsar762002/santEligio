import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { join } from 'path';
import { unlink } from 'fs/promises';
import { Media, MediaDocument } from './schemas/media.schema';

@Injectable()
export class MediaService {
  constructor(@InjectModel(Media.name) private mediaModel: Model<MediaDocument>) {}

  findAll() {
    return this.mediaModel.find().sort({ createdAt: -1 });
  }

  create(data: Partial<Media>) {
    return this.mediaModel.create(data);
  }

  async remove(id: string) {
    const item = await this.mediaModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException();
    // Rimuove anche il file dal disco; ignora se già assente.
    await unlink(join(process.cwd(), 'uploads', item.filename)).catch(() => undefined);
  }
}
