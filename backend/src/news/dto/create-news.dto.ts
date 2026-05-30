import { IsString, IsOptional, IsBoolean, IsEnum, MaxLength } from 'class-validator';
import { CategoriaNews } from '../schemas/news.schema';

export class CreateNewsDto {
  @IsString()
  @MaxLength(200)
  titolo: string;

  @IsString()
  testo: string;

  @IsOptional()
  @IsEnum(CategoriaNews)
  categoria?: CategoriaNews;

  @IsOptional()
  @IsBoolean()
  pubblicato?: boolean;

  @IsOptional()
  @IsString()
  immagine?: string;
}
