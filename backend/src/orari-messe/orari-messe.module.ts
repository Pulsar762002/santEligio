import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrarioMessa, OrarioMessaSchema } from './schemas/orario-messa.schema';
import { OrariMesseService } from './orari-messe.service';
import { OrariMesseController } from './orari-messe.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OrarioMessa.name, schema: OrarioMessaSchema }]),
  ],
  providers: [OrariMesseService],
  controllers: [OrariMesseController],
})
export class OrariMesseModule {}
