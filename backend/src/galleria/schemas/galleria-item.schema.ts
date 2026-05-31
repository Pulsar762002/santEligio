import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GalleriaItemDocument = GalleriaItem & Document;

export enum TipoMedia {
  FOTO = 'foto',
  VIDEO = 'video',
}

@Schema({ timestamps: true, collection: 'galleria' })
export class GalleriaItem {
  @Prop({ required: true })
  categoria: string; // slug della categoria

  @Prop({ type: String, enum: Object.values(TipoMedia), default: TipoMedia.FOTO })
  tipo: TipoMedia;

  @Prop({ required: true })
  url: string;

  @Prop()
  titolo: string;

  @Prop({ default: 0 })
  ordine: number;
}

export const GalleriaItemSchema = SchemaFactory.createForClass(GalleriaItem);
