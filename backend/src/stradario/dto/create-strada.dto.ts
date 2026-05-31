import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { Contrada } from '../schemas/strada.schema';

export class CreateStradaDto {
  @IsEnum(Contrada)
  contrada: Contrada;

  @IsString()
  via: string;

  @IsOptional()
  @IsInt()
  ordine?: number;
}
