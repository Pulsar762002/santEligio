import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StradaDocument = Strada & Document;

export enum Contrada {
  LA_CONTESSA = 'La Contessa',
  IL_MERICAIO = 'Il Mericaio',
  L_OVILE = "L'Ovile",
  LE_BOTTI = 'Le Botti',
}

@Schema({ timestamps: true, collection: 'stradario' })
export class Strada {
  @Prop({ required: true, type: String, enum: Object.values(Contrada) })
  contrada: Contrada;

  @Prop({ required: true })
  via: string;

  @Prop({ default: 0 })
  ordine: number;
}

export const StradaSchema = SchemaFactory.createForClass(Strada);
