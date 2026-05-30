import { PartialType } from '@nestjs/mapped-types';
import { CreateOrarioMessaDto } from './create-orario-messa.dto';

export class UpdateOrarioMessaDto extends PartialType(CreateOrarioMessaDto) {}
