import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { TipoAttivita } from '../schemas/calendario-attivita.schema';

export class CreateCalendarioAttivitaDto {
  @IsDateString()
  data: string;

  @IsString()
  ora: string;

  @IsString()
  @MaxLength(200)
  titolo: string;

  @IsOptional()
  @IsEnum(TipoAttivita)
  tipo?: TipoAttivita;

  @IsOptional()
  @IsString()
  luogo?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  pubblicato?: boolean;
}
