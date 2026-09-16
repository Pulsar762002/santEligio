import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarioAttivitaDocument = CalendarioAttivita & Document;

export enum TipoAttivita {
  MESSA = 'messa',
  EVENTO = 'evento',
  CATECHESI = 'catechesi',
  CARITA = 'carita',
  LITURGIA = 'liturgia',
  ALTRO = 'altro',
}

export enum FonteAttivita {
  MESSA = 'messa',
  EVENTO = 'evento',
  MANUALE = 'manuale',
}

export enum ColoreAttivita {
  NERO = 'nero',
  ROSSO = 'rosso',
  BLU = 'blu',
  VERDE = 'verde',
  ARANCIONE = 'arancione',
  VIOLA = 'viola',
}

@Schema({ timestamps: true, collection: 'calendario_attivita' })
export class CalendarioAttivita {
  @Prop({ required: true })
  data: Date;

  @Prop({ required: true })
  ora: string;

  @Prop({ required: true, maxlength: 200 })
  titolo: string;

  @Prop({ type: String, enum: Object.values(TipoAttivita), default: TipoAttivita.ALTRO })
  tipo: TipoAttivita;

  @Prop()
  luogo: string;

  @Prop()
  note: string;

  @Prop({ type: String, enum: Object.values(FonteAttivita), default: FonteAttivita.MANUALE })
  fonte: FonteAttivita;

  @Prop()
  fonteRifId: string;

  @Prop({ default: true })
  pubblicato: boolean;

  @Prop({ type: String, enum: Object.values(ColoreAttivita), default: ColoreAttivita.NERO })
  colore: ColoreAttivita;

  @Prop({ default: false })
  grassetto: boolean;

  @Prop({ default: false })
  corsivo: boolean;
}

export const CalendarioAttivitaSchema = SchemaFactory.createForClass(CalendarioAttivita);
