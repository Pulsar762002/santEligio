import { IsString, IsOptional, IsBoolean, IsDateString, IsIn, MaxLength } from 'class-validator';
import { CHIAVI_AREE } from '../../aree/aree.registry';

export class CreateEventoDto {
  @IsString()
  @MaxLength(200)
  titolo: string;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsDateString()
  dataInizio: string;

  @IsOptional()
  @IsDateString()
  dataFine?: string;

  @IsOptional()
  @IsString()
  luogo?: string;

  @IsOptional()
  @IsString()
  immagine?: string;

  @IsOptional()
  @IsBoolean()
  pubblicato?: boolean;

  @IsOptional()
  @IsIn(CHIAVI_AREE)
  area?: string;
}
