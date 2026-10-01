import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

/** Contenuto della pagina dell'area (o del gruppo, per le aree di tipo gruppo). */
export class ContenutoAreaDto {
  @IsString() @IsNotEmpty({ message: 'Il titolo è obbligatorio' }) @MaxLength(200)
  titolo: string;

  @IsOptional() @IsString() @MaxLength(300)
  sottotitolo?: string;

  @IsString() @IsNotEmpty({ message: 'Il contenuto è obbligatorio' })
  contenuto: string;

  @IsOptional() @IsString() @MaxLength(500)
  immagine?: string;
}

export class RifiutoDto {
  @IsOptional() @IsString() @MaxLength(1000)
  nota?: string;
}
