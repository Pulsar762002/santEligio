import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MediaDocument = Media & Document;

@Schema({ timestamps: true, collection: 'media' })
export class Media {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  filename: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  mimetype: string;

  @Prop({ default: 0 })
  size: number;

  /** Chi ha caricato il file (assente per i file storici = solo l'admin li elimina). */
  @Prop()
  caricatoDa?: string;

  @Prop()
  caricatoDaNome?: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
