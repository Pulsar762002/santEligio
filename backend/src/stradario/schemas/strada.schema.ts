import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StradaDocument = Strada & Document;

@Schema({ timestamps: true, collection: 'stradario' })
export class Strada {
  @Prop({ required: true })
  contrada: string;

  @Prop({ required: true })
  via: string;

  @Prop({ default: 0 })
  ordine: number;
}

export const StradaSchema = SchemaFactory.createForClass(Strada);
