import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventoDocument = Evento & Document;

@Schema({ timestamps: true, collection: 'eventi' })
export class Evento {
  @Prop({ required: true, maxlength: 200 })
  titolo: string;

  @Prop()
  descrizione: string;

  @Prop({ required: true })
  dataInizio: Date;

  @Prop()
  dataFine: Date;

  @Prop()
  luogo: string;

  @Prop()
  immagine: string;

  @Prop({ default: false })
  pubblicato: boolean;

  /** Evento importante: card grande in cima a /eventi e sezione dedicata in home. */
  @Prop({ default: false })
  inEvidenza: boolean;

  /**
   * Periodo di visibilità facoltativo: prima di `visibileDal` e dopo `visibileFino`
   * l'evento non compare negli elenchi pubblici. Assenti = sempre visibile.
   */
  @Prop({ type: Date, default: null })
  visibileDal: Date | null;

  @Prop({ type: Date, default: null })
  visibileFino: Date | null;

  /**
   * Aree (aree/aree.registry.ts) a cui appartiene l'evento: responsabili e contributor
   * di queste aree lo vedono e lo gestiscono. Vuoto/assente = solo admin (eventi storici).
   */
  @Prop({ type: [String], default: [], index: true })
  aree: string[];
}

export const EventoSchema = SchemaFactory.createForClass(Evento);
