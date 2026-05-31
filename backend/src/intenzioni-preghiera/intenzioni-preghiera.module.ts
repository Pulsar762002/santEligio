import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  IntenzionePreghiera,
  IntenzionePreghieraSchema,
} from './schemas/intenzione-preghiera.schema';
import { IntenzioniPreghieraService } from './intenzioni-preghiera.service';
import { IntenzioniPreghieraController } from './intenzioni-preghiera.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IntenzionePreghiera.name, schema: IntenzionePreghieraSchema },
    ]),
  ],
  providers: [IntenzioniPreghieraService],
  controllers: [IntenzioniPreghieraController],
})
export class IntenzioniPreghieraModule {}
