import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { UtenteAutenticato } from '../auth/ruoli';
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

  /** L'admin elimina tutto; gli altri solo i file caricati da loro (i file sono condivisi dal sito). */
  async remove(id: string, u: UtenteAutenticato) {
    const item = isValidObjectId(id) ? await this.mediaModel.findById(id) : null;
    if (!item) throw new NotFoundException();
    if (u.ruolo !== 'admin' && item.caricatoDa !== u.userId) {
      throw new ForbiddenException('Puoi eliminare solo i file caricati da te.');
    }
    await item.deleteOne();
    // Rimuove anche il file dal disco; ignora se già assente.
    await unlink(join(process.cwd(), 'uploads', item.filename)).catch(() => undefined);
  }
}
