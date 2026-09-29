import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarioIntestazioneDocument = CalendarioIntestazione & Document;

/** Titolo + descrizione mostrati nel PDF del calendario, subito sotto la riga del mese. Uno per mese. */
@Schema({ timestamps: true, collection: 'calendario_intestazioni' })
export class CalendarioIntestazione {
  @Prop({ required: true, min: 2000, max: 2100 })
  anno: number;

  @Prop({ required: true, min: 1, max: 12 })
  mese: number;

  @Prop({ maxlength: 200, default: '' })
  titolo: string;

  @Prop({ maxlength: 2000, default: '' })
  descrizione: string;
}

export const CalendarioIntestazioneSchema = SchemaFactory.createForClass(CalendarioIntestazione);
CalendarioIntestazioneSchema.index({ anno: 1, mese: 1 }, { unique: true });
