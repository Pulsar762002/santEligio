import { PartialType } from '@nestjs/mapped-types';
import { CreateCalendarioAttivitaDto } from './create-calendario-attivita.dto';

export class UpdateCalendarioAttivitaDto extends PartialType(CreateCalendarioAttivitaDto) {}
