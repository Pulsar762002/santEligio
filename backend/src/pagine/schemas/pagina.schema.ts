import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaginaDocument = Pagina & Document;

export enum SezionePagina {
  PARROCCHIA = 'parrocchia',
  PARROCO = 'parroco',
  DIACONO = 'diacono',
  CARITAS = 'caritas',
  CONSULTORIO = 'consultorio',
  ORGANISMI = 'organismi',
  SACRAMENTI = 'sacramenti',
  GRUPPI = 'gruppi',
  ALTRO = 'altro',
}

@Schema({ timestamps: true, collection: 'pagine' })
export class Pagina {
  @Prop({ required: true, unique: true, maxlength: 120 })
  slug: string;

  @Prop({ required: true, maxlength: 200 })
  titolo: string;

  @Prop({ maxlength: 300 })
  sottotitolo: string;

  @Prop({ required: true })
  contenuto: string;

  @Prop({ type: String, enum: Object.values(SezionePagina), default: SezionePagina.ALTRO })
  sezione: SezionePagina;

  @Prop()
  immagine: string;

  @Prop({ default: 0 })
  ordine: number;

  @Prop({ default: true })
  pubblicato: boolean;
}

export const PaginaSchema = SchemaFactory.createForClass(Pagina);
