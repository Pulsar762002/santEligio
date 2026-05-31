import { PartialType } from '@nestjs/mapped-types';
import { CreateGruppoDto } from './create-gruppo.dto';

export class UpdateGruppoDto extends PartialType(CreateGruppoDto) {}
