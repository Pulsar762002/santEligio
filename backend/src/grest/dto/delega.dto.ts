import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, Equals, IsIn, IsNotEmpty, IsString, MaxLength, ValidateNested,
} from 'class-validator';
import { TIPI_DOCUMENTO } from '../grest.constants';

export class DelegatoDto {
  @IsString() @IsNotEmpty() @MaxLength(80) nome: string;
  @IsString() @IsNotEmpty() @MaxLength(80) cognome: string;
  @IsIn(TIPI_DOCUMENTO) tipoDocumento: string;
  @IsString() @IsNotEmpty() @MaxLength(40) numeroDocumento: string;
}

export class DelegaDto {
  @ValidateNested({ each: true })
  @Type(() => DelegatoDto)
  @ArrayMinSize(1, { message: 'Inserisci almeno un delegato' })
  @ArrayMaxSize(4, { message: 'Al massimo 4 delegati' })
  delegati: DelegatoDto[];

  @Equals(true, { message: 'La dichiarazione di responsabilità genitoriale è obbligatoria' })
  consenso: boolean;
}
