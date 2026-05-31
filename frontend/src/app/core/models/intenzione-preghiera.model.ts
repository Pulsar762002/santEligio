export interface IntenzionePreghiera {
  _id: string;
  testo: string;
  nome?: string;
  letta: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NuovaIntenzionePreghiera {
  testo: string;
  nome?: string;
}
