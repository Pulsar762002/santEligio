import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Gruppo, GruppoSchema } from './schemas/gruppo.schema';
import { GruppiService } from './gruppi.service';
import { GruppiController } from './gruppi.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Gruppo.name, schema: GruppoSchema }])],
  providers: [GruppiService],
  controllers: [GruppiController],
})
export class GruppiModule {}
