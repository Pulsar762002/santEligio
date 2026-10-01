import { IsBoolean } from 'class-validator';

export class ImpostazioniDto {
  @IsBoolean() iscrizioniAperte: boolean;
}
