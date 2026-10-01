import { AreaPortale } from './utente.model';
import { Evento } from './evento.model';

export interface AreaMia extends AreaPortale {
  esiste: boolean;
  pubblicato: boolean;
  link: string;
  propostePendenti: number;
}

export interface ContenutoArea {
  esiste?: boolean;
  titolo: string;
  sottotitolo: string;
  contenuto: string;
  immagine: string;
}

export type StatoProposta = 'in_attesa' | 'approvata' | 'rifiutata';

export interface Proposta {
  _id: string;
  tipo: 'contenuto' | 'evento';
  azione: 'crea' | 'modifica';
  area: string;
  eventoId?: string;
  titolo: string;
  dati: Record<string, any>;
  autoreId: string;
  autoreNome: string;
  stato: StatoProposta;
  nota: string;
  decisoDa?: string;
  decisoIl?: string;
  createdAt: string;
}

/** Risposta dei salvataggi: applicato subito o inviato in approvazione. */
export type Esito<T> = { inAttesa: false; risultato: T } | { inAttesa: true; proposta: Proposta };

export type EventoArea = Evento & { area?: string };
