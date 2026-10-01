import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RUOLI, Ruolo } from '../../auth/ruoli';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'utenti' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: '' })
  nome: string;

  @Prop({ type: String, enum: RUOLI, default: 'utente' })
  ruolo: Ruolo;

  /** Chiavi delle aree di cui è responsabile/contributor (vedi aree/aree.registry.ts). */
  @Prop({ type: [String], default: [] })
  aree: string[];

  @Prop({ default: true })
  attivo: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
