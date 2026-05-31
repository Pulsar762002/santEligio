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
}

export const MediaSchema = SchemaFactory.createForClass(Media);
