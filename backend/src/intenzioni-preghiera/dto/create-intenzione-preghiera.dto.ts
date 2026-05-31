import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateIntenzionePreghieraDto {
  @IsString()
  @MaxLength(2000)
  testo: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nome?: string;
}
