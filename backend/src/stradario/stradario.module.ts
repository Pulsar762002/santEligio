import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StradarioController } from './stradario.controller';
import { StradarioService } from './stradario.service';
import { Strada, StradaSchema } from './schemas/strada.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Strada.name, schema: StradaSchema }])],
  controllers: [StradarioController],
  providers: [StradarioService],
})
export class StradarioModule {}
