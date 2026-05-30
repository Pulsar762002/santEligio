import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ timestamps: true, collection: 'eventi' })
export class Evento {
  @Prop({ required: true, maxlength: 200 })
  titolo: string;

  @Prop()
  descrizione: string;

  @Prop({ required: true })
  dataInizio: Date;

  @Prop()
  dataFine: Date;

  @Prop()
  luogo: string;

  @Prop({ default: false })
  pubblicato: boolean;
}

export const EventoSchema = SchemaFactory.createForClass(Evento);
