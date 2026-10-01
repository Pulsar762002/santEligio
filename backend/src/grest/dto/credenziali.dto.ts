import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GrestLoginDto {
  @IsString() @IsNotEmpty() @MaxLength(160) username: string;
  @IsString() @IsNotEmpty() @MaxLength(200) password: string;
}

/** Attivazione account / reimpostazione password dal link ricevuto via email. */
export class AttivazioneDto {
  @IsString() @IsNotEmpty() @MaxLength(128) token: string;
  @IsString() @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' }) @MaxLength(200)
  password: string;
}

export class CancellazioneDto {
  @IsOptional() @IsString() @MaxLength(1000) motivo?: string;
}

export class CambioPasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(200) attuale: string;
  @IsString() @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' }) @MaxLength(200)
  nuova: string;
}
