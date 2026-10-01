import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength,
} from 'class-validator';
import { RUOLI, Ruolo } from '../../auth/ruoli';
import { CHIAVI_AREE } from '../../aree/aree.registry';

export class CreaUtenteDto {
  @IsEmail({}, { message: 'Email non valida' }) @MaxLength(160)
  email: string;

  @IsString() @IsNotEmpty({ message: 'Il nome è obbligatorio' }) @MaxLength(120)
  nome: string;

  @IsIn(RUOLI as unknown as string[])
  ruolo: Ruolo;

  @IsOptional() @IsArray() @ArrayMaxSize(CHIAVI_AREE.length) @IsIn(CHIAVI_AREE, { each: true })
  aree?: string[];

  @IsString() @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' }) @MaxLength(200)
  password: string;
}

export class ModificaUtenteDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120)
  nome?: string;

  @IsOptional() @IsIn(RUOLI as unknown as string[])
  ruolo?: Ruolo;

  @IsOptional() @IsArray() @ArrayMaxSize(CHIAVI_AREE.length) @IsIn(CHIAVI_AREE, { each: true })
  aree?: string[];

  @IsOptional() @IsBoolean()
  attivo?: boolean;
}

export class PasswordDto {
  @IsString() @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' }) @MaxLength(200)
  password: string;
}

export class CambioPasswordDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  attuale: string;

  @IsString() @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' }) @MaxLength(200)
  nuova: string;
}
