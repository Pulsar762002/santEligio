import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GalleriaController } from './galleria.controller';
import { GalleriaService } from './galleria.service';
import { GalleriaCategoria, GalleriaCategoriaSchema } from './schemas/galleria-categoria.schema';
import { GalleriaItem, GalleriaItemSchema } from './schemas/galleria-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GalleriaCategoria.name, schema: GalleriaCategoriaSchema },
      { name: GalleriaItem.name, schema: GalleriaItemSchema },
    ]),
  ],
  controllers: [GalleriaController],
  providers: [GalleriaService],
})
export class GalleriaModule {}
