import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IntenzionePreghieraDocument = IntenzionePreghiera & Document;

@Schema({ timestamps: true, collection: 'intenzioni_preghiera' })
export class IntenzionePreghiera {
  @Prop({ required: true, maxlength: 2000 })
  testo: string;

  @Prop({ maxlength: 120 })
  nome: string;

  @Prop({ default: false })
  letta: boolean;
}

export const IntenzionePreghieraSchema = SchemaFactory.createForClass(IntenzionePreghiera);
