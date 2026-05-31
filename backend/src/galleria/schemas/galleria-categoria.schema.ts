import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GalleriaCategoriaDocument = GalleriaCategoria & Document;

@Schema({ timestamps: true, collection: 'galleria_categorie' })
export class GalleriaCategoria {
  @Prop({ required: true })
  nome: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: 0 })
  ordine: number;
}

export const GalleriaCategoriaSchema = SchemaFactory.createForClass(GalleriaCategoria);
