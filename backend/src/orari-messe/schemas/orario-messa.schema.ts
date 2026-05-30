import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrarioMessaDocument = OrarioMessa & Document;

export enum TipoMessa {
  FERIALE = 'feriale',
  FESTIVA = 'festiva',
  PREFESTIVA = 'prefestiva',
}

@Schema({ timestamps: true, collection: 'orari_messe' })
export class OrarioMessa {
  @Prop({ required: true })
  giorno: string;

  @Prop({ required: true })
  ora: string;

  @Prop({ type: String, enum: Object.values(TipoMessa), default: TipoMessa.FESTIVA })
  tipo: TipoMessa;

  @Prop()
  chiesa: string;

  @Prop()
  note: string;

  @Prop({ default: true })
  attivo: boolean;

  @Prop({ default: 0 })
  ordine: number;
}

export const OrarioMessaSchema = SchemaFactory.createForClass(OrarioMessa);
