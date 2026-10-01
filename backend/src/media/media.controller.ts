import {
  Controller, Get, Post, Delete,
  Param, Req, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Ruoli, RUOLI_STAFF, UtenteAutenticato } from '../auth/ruoli';
import { Request } from 'express';

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
]);

// Libreria media: Admin, Responsabili e Contributor (non gli Utenti).
@UseGuards(JwtAuthGuard)
@Ruoli(...RUOLI_STAFF)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll() {
    return this.mediaService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${suffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: +(process.env.UPLOAD_MAX_SIZE_MB ?? 10) * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.has(file.mimetype)) {
          return cb(new BadRequestException('Tipo file non consentito'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Nessun file ricevuto');
    const u = req.user as UtenteAutenticato;
    return this.mediaService.create({
      caricatoDa: u.userId,
      caricatoDaNome: u.nome || u.email,
      originalName: file.originalname,
      filename: file.filename,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.mediaService.remove(id, req.user as UtenteAutenticato);
  }
}
