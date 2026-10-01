import { IsBoolean, IsOptional } from 'class-validator';

export class ImpostazioniDto {
  @IsOptional() @IsBoolean() iscrizioniAperte?: boolean;
  @IsOptional() @IsBoolean() accessoRistretto?: boolean;
}

export class AbilitatoDto {
  @IsBoolean() abilitato: boolean;
}
