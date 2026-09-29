import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SalvaCalendarioIntestazioneDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titolo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descrizione?: string;
}
