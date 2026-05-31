import { IsString, IsOptional, IsInt, IsEnum, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { TipoMedia } from '../schemas/galleria-item.schema';

export class CreateCategoriaDto {
  @IsString()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  ordine?: number;
}

export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {}

export class CreateItemDto {
  @IsString()
  categoria: string;

  @IsEnum(TipoMedia)
  tipo: TipoMedia;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  titolo?: string;

  @IsOptional()
  @IsInt()
  ordine?: number;
}

export class UpdateItemDto extends PartialType(CreateItemDto) {}
