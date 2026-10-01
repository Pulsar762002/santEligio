import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Proposta, PropostaSchema } from './schemas/proposta.schema';
import { Pagina, PaginaSchema } from '../pagine/schemas/pagina.schema';
import { Gruppo, GruppoSchema } from '../gruppi/schemas/gruppo.schema';
import { Evento, EventoSchema } from '../eventi/schemas/evento.schema';
import { AreeService } from './aree.service';
import { AreeController, ProposteController } from './aree.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposta.name, schema: PropostaSchema },
      { name: Pagina.name, schema: PaginaSchema },
      { name: Gruppo.name, schema: GruppoSchema },
      { name: Evento.name, schema: EventoSchema },
    ]),
  ],
  providers: [AreeService],
  controllers: [AreeController, ProposteController],
})
export class AreeModule {}
