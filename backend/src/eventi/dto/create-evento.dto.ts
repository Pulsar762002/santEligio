import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';

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
}
