import { ArrayMaxSize, IsArray, IsString, IsOptional, IsBoolean, IsDateString, IsIn, MaxLength, ValidateIf } from 'class-validator';
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
  @IsBoolean()
  inEvidenza?: boolean;

  // null = togli il limite (PATCH)
  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsDateString()
  visibileDal?: string | null;

  @ValidateIf((_, v) => v !== undefined && v !== null)
  @IsDateString()
  visibileFino?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CHIAVI_AREE.length)
  @IsIn(CHIAVI_AREE, { each: true })
  aree?: string[];
}
