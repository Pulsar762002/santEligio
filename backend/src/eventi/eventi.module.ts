import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Evento, EventoSchema } from './schemas/evento.schema';
import { EventiService } from './eventi.service';
import { EventiController } from './eventi.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Evento.name, schema: EventoSchema }])],
  providers: [EventiService],
  controllers: [EventiController],
})
export class EventiModule {}
