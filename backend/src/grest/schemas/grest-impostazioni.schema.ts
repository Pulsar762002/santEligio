import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GrestImpostazioniDocument = GrestImpostazioni & Document;

/** Chiave dell'unico documento di impostazioni. */
export const IMPOSTAZIONI_GREST = 'grest';

// Impostazioni del portale Grest modificabili dall'admin (un solo documento).
// Se il documento non esiste valgono le variabili d'ambiente GREST_*.
@Schema({ timestamps: true, collection: 'grest_impostazioni' })
export class GrestImpostazioni {
  @Prop({ required: true, unique: true, default: IMPOSTAZIONI_GREST })
  chiave: string;

  /** Assente = vale GREST_ISCRIZIONI_APERTE. */
  @Prop()
  iscrizioniAperte?: boolean;

  /** true = al portale famiglie accedono solo gli iscritti con `abilitato`. */
  @Prop({ default: false })
  accessoRistretto?: boolean;
}

export const GrestImpostazioniSchema = SchemaFactory.createForClass(GrestImpostazioni);
