import { IsString, IsOptional, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { TipoMessa } from '../schemas/orario-messa.schema';

export class CreateOrarioMessaDto {
  @IsString()
  giorno: string;

  @IsString()
  ora: string;

  @IsOptional()
  @IsEnum(TipoMessa)
  tipo?: TipoMessa;

  @IsOptional()
  @IsString()
  chiesa?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  attivo?: boolean;

  @IsOptional()
  @IsInt()
  ordine?: number;
}
