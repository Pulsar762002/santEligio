import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, MaxLength } from 'class-validator';
import { SezionePagina } from '../schemas/pagina.schema';

export class CreatePaginaDto {
  @IsString()
  @MaxLength(120)
  slug: string;

  @IsString()
  @MaxLength(200)
  titolo: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  sottotitolo?: string;

  @IsString()
  contenuto: string;

  @IsOptional()
  @IsEnum(SezionePagina)
  sezione?: SezionePagina;

  @IsOptional()
  @IsString()
  immagine?: string;

  @IsOptional()
  @IsInt()
  ordine?: number;

  @IsOptional()
  @IsBoolean()
  pubblicato?: boolean;
}
