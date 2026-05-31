import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateIntenzionePreghieraDto {
  @IsOptional()
  @IsBoolean()
  letta?: boolean;
}
