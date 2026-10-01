import { IsString, Matches, MaxLength, IsNotEmpty } from 'class-validator';
import { DATA_NASCITA_RE, EMAIL_O_VUOTA_RE, TELEFONO_RE } from '../grest.constants';

// Registrazione pubblica di un nuovo iscritto (primo passo: poi arriva l'email di attivazione).
// Almeno uno dei due genitori deve avere nome, cognome, email e cellulare: lo verifica il service.
export class RegistrazioneDto {
  @IsString() @MaxLength(80) nomePadre = '';
  @IsString() @MaxLength(80) cognomePadre = '';
  @IsString() @MaxLength(120) @Matches(EMAIL_O_VUOTA_RE, { message: 'Email del padre non valida' })
  emailPadre = '';
  @IsString() @MaxLength(20) @Matches(TELEFONO_RE, { message: 'Cellulare del padre: solo cifre' })
  mobilePhonePadre = '';

  @IsString() @MaxLength(80) nomeMadre = '';
  @IsString() @MaxLength(80) cognomeMadre = '';
  @IsString() @MaxLength(120) @Matches(EMAIL_O_VUOTA_RE, { message: 'Email della madre non valida' })
  emailMadre = '';
  @IsString() @MaxLength(20) @Matches(TELEFONO_RE, { message: 'Cellulare della madre: solo cifre' })
  mobilePhoneMadre = '';

  @IsString() @IsNotEmpty() @MaxLength(80) nomeFiglio: string;
  @IsString() @IsNotEmpty() @MaxLength(80) cognomeFiglio: string;
  @IsString() @IsNotEmpty() @MaxLength(80) natoA: string;
  @IsString() @Matches(DATA_NASCITA_RE, { message: 'Data di nascita nel formato gg/mm/aaaa' })
  natoIl: string;
  @IsString() @IsNotEmpty() @MaxLength(80) residenteA: string;
  @IsString() @IsNotEmpty() @MaxLength(120) via: string;
}
