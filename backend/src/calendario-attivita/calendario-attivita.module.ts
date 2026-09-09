import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarioAttivita, CalendarioAttivitaSchema } from './schemas/calendario-attivita.schema';
import { OrarioMessa, OrarioMessaSchema } from '../orari-messe/schemas/orario-messa.schema';
import { Evento, EventoSchema } from '../eventi/schemas/evento.schema';
import { CalendarioAttivitaService } from './calendario-attivita.service';
import { CalendarioAttivitaController } from './calendario-attivita.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarioAttivita.name, schema: CalendarioAttivitaSchema },
      { name: OrarioMessa.name, schema: OrarioMessaSchema },
      { name: Evento.name, schema: EventoSchema },
    ]),
  ],
  providers: [CalendarioAttivitaService],
  controllers: [CalendarioAttivitaController],
})
export class CalendarioAttivitaModule {}
