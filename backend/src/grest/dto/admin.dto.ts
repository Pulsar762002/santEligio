import { OmitType } from '@nestjs/mapped-types';
import { IsBoolean, IsString, MaxLength } from 'class-validator';
import { IscrizioneDto } from './iscrizione.dto';
import { DelegaDto } from './delega.dto';

// Versioni per i responsabili Grest: stessi campi dei moduli famiglia, ma senza le
// dichiarazioni di consenso (restano quelle date dalla famiglia).

export class IscrizioneAdminDto extends OmitType(IscrizioneDto, ['consenso'] as const) {}

export class DelegaAdminDto extends OmitType(DelegaDto, ['consenso'] as const) {}

export class AutorizzazioneAdminDto {
  @IsBoolean() dichiarazione1: boolean;
  @IsBoolean() dichiarazione2: boolean;
  @IsBoolean() dichiarazione3: boolean;
  @IsBoolean() dichiarazione4: boolean;
  @IsBoolean() dichiarazione5: boolean;
  @IsBoolean() dichiarazione6: boolean;
  @IsBoolean() dichiarazione7: boolean;
  @IsString() @MaxLength(1000) allergie = '';
  @IsString() @MaxLength(1000) intolleranze = '';
  @IsBoolean() autorizzazione1: boolean;
  @IsBoolean() autorizzazione2: boolean;
  @IsBoolean() autorizzazione3: boolean;
  @IsBoolean() autorizzazione4: boolean;
}
