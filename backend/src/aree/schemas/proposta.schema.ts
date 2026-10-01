import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PropostaDocument = Proposta & Document;

export type TipoProposta = 'contenuto' | 'evento';
export type AzioneProposta = 'crea' | 'modifica';
export type StatoProposta = 'in_attesa' | 'approvata' | 'rifiutata';

// Modifica proposta da un Contributor: resta qui finché un Responsabile dell'area
// (o un Admin) non la approva — solo allora viene applicata al contenuto pubblico.
@Schema({ timestamps: true, collection: 'proposte' })
export class Proposta {
  @Prop({ required: true, enum: ['contenuto', 'evento'] })
  tipo: TipoProposta;

  @Prop({ required: true, enum: ['crea', 'modifica'] })
  azione: AzioneProposta;

  /**
   * Aree interessate: chi è responsabile di almeno una di queste può approvare.
   * Contenuto di pagina = la sola area della pagina.
   */
  @Prop({ type: [String], required: true, index: true })
  aree: string[];

  /** Evento da modificare (solo tipo evento + azione modifica). */
  @Prop()
  eventoId?: string;

  /** Titolo da mostrare nelle liste (pagina o evento). */
  @Prop({ default: '' })
  titolo: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  dati: Record<string, unknown>;

  @Prop({ required: true, index: true })
  autoreId: string;

  @Prop({ default: '' })
  autoreNome: string;

  @Prop({ required: true, enum: ['in_attesa', 'approvata', 'rifiutata'], default: 'in_attesa', index: true })
  stato: StatoProposta;

  @Prop({ default: '' })
  nota: string;

  @Prop()
  decisoDa?: string;

  @Prop()
  decisoIl?: Date;
}

export const PropostaSchema = SchemaFactory.createForClass(Proposta);
