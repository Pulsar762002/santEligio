import { IsBoolean, IsIn, IsNotEmpty, IsString, Matches, MaxLength, Equals } from 'class-validator';
import { RegistrazioneDto } from './registrazione.dto';
import { ANNI_CATECHISMO, TAGLIE, TELEFONO_RE } from '../grest.constants';

// Modulo di iscrizione completo (area famiglia). Lo username non cambia.
export class IscrizioneDto extends RegistrazioneDto {
  @IsIn(ANNI_CATECHISMO) annoCatechismo: string;
  @IsString() @IsNotEmpty() @MaxLength(40) annoElementari: string;
  @IsIn(TAGLIE) taglia: string;

  @IsString() @MaxLength(120) altroContatto = '';
  @IsString() @MaxLength(20) @Matches(TELEFONO_RE, { message: 'Cellulare altro contatto: solo cifre' })
  mobilePhoneAltro = '';
  @IsString() @MaxLength(2000) altroDaSegnalare = '';

  @IsBoolean() uscita1: boolean;

  @Equals(true, { message: 'La dichiarazione di responsabilità genitoriale è obbligatoria' })
  consenso: boolean;
}
