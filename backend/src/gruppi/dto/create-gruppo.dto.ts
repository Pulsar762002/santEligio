import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, MaxLength } from 'class-validator';
import { AreaGruppo } from '../schemas/gruppo.schema';

export class CreateGruppoDto {
  @IsString()
  @MaxLength(200)
  nome: string;

  @IsEnum(AreaGruppo)
  area: AreaGruppo;

  @IsOptional()
  @IsString()
  descrizione?: string;

  @IsOptional()
  @IsString()
  referente?: string;

  @IsOptional()
  @IsString()
  contatto?: string;

  @IsOptional()
  @IsInt()
  ordine?: number;

  @IsOptional()
  @IsBoolean()
  pubblicato?: boolean;
}
