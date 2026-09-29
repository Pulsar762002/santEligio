import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarioIntestazione, CalendarioIntestazioneSchema } from './schemas/calendario-intestazione.schema';
import { CalendarioIntestazioniService } from './calendario-intestazioni.service';
import { CalendarioIntestazioniController } from './calendario-intestazioni.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarioIntestazione.name, schema: CalendarioIntestazioneSchema },
    ]),
  ],
  providers: [CalendarioIntestazioniService],
  controllers: [CalendarioIntestazioniController],
})
export class CalendarioIntestazioniModule {}
