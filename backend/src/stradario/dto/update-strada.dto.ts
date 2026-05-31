import { PartialType } from '@nestjs/mapped-types';
import { CreateStradaDto } from './create-strada.dto';

export class UpdateStradaDto extends PartialType(CreateStradaDto) {}
