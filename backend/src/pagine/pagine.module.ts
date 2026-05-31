import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pagina, PaginaSchema } from './schemas/pagina.schema';
import { PagineService } from './pagine.service';
import { PagineController } from './pagine.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Pagina.name, schema: PaginaSchema }])],
  providers: [PagineService],
  controllers: [PagineController],
})
export class PagineModule {}
