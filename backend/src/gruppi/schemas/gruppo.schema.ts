import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GruppoDocument = Gruppo & Document;

export enum AreaGruppo {
  LITURGIA = 'liturgia',
  CATECHESI = 'catechesi',
  CARITA = 'carita',
}

@Schema({ timestamps: true, collection: 'gruppi' })
export class Gruppo {
  @Prop({ required: true, maxlength: 200 })
  nome: string;

  @Prop({ type: String, enum: Object.values(AreaGruppo), required: true })
  area: AreaGruppo;

  // Slug opzionale: se presente, il gruppo ha una pagina di dettaglio (/gruppi/:area/:slug).
  @Prop({ maxlength: 120 })
  slug: string;

  // Contenuto HTML della pagina di dettaglio del gruppo (opzionale).
  @Prop()
  contenuto: string;

  @Prop()
  immagine: string;

  @Prop()
  descrizione: string;

  @Prop()
  referente: string;

  @Prop()
  contatto: string;

  @Prop({ default: 0 })
  ordine: number;

  @Prop({ default: true })
  pubblicato: boolean;
}

export const GruppoSchema = SchemaFactory.createForClass(Gruppo);
