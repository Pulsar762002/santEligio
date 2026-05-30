import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsDocument = News & Document;

export enum CategoriaNews {
  LITURGIA = 'liturgia',
  CATECHISMO = 'catechismo',
  CARITAS = 'caritas',
  EVENTI = 'eventi',
  COMUNICATI = 'comunicati',
}

@Schema({ timestamps: true, collection: 'news' })
export class News {
  @Prop({ required: true, maxlength: 200 })
  titolo: string;

  @Prop({ required: true })
  testo: string;

  @Prop({ type: String, enum: Object.values(CategoriaNews) })
  categoria: CategoriaNews;

  @Prop({ default: false })
  pubblicato: boolean;

  @Prop()
  immagine: string;
}

export const NewsSchema = SchemaFactory.createForClass(News);
