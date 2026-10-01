import { Equals, IsBoolean, IsString, MaxLength } from 'class-validator';

// Modulo di autorizzazione (vedi GrestAutorizzazione per il significato dei campi).
// Le voci "solo Sì" del modulo cartaceo (6, 7, autorizzazione3, consenso) sono obbligatorie.
export class AutorizzazioneDto {
  @IsBoolean() dichiarazione1: boolean;
  @IsBoolean() dichiarazione2: boolean;
  @IsBoolean() dichiarazione3: boolean;
  @IsBoolean() dichiarazione4: boolean;
  @IsBoolean() dichiarazione5: boolean;
  @Equals(true, { message: 'La presa visione sulla somministrazione dei medicinali è obbligatoria' })
  dichiarazione6: boolean;
  @Equals(true, { message: 'La dichiarazione ai sensi degli artt. 75 e 76 è obbligatoria' })
  dichiarazione7: boolean;

  @IsString() @MaxLength(1000) allergie = '';
  @IsString() @MaxLength(1000) intolleranze = '';

  @IsBoolean() autorizzazione1: boolean;
  @IsBoolean() autorizzazione2: boolean;
  @Equals(true, { message: "L'autorizzazione a partecipare alle attività è obbligatoria" })
  autorizzazione3: boolean;
  @IsBoolean() autorizzazione4: boolean;

  @Equals(true, { message: 'La dichiarazione di responsabilità genitoriale è obbligatoria' })
  consenso: boolean;
}
